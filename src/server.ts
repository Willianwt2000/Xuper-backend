import dotenv from "dotenv";
// 1. CARGA DE VARIABLES (CRUCIAL: Debe ser lo primero)
dotenv.config();

import crypto from "crypto";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "./config/firebase-config.js";
import { connectDB } from "./config/db.js";
import EmailVerification from "./models/emailVerification.js";
import { User } from "./models/user.js";
import { sendVerificationCodeEmail } from "./services/emailService.js";
import jwt from 'jsonwebtoken';


connectDB();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'user';
  };
}

interface JwtPayload extends jwt.JwtPayload {
  id: string;
  role?: 'admin' | 'user';
};

// Middleware para verificar autenticación
const ensureAuth = async (req: Request, res: Response, next: () => void): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No se proporcionó token de autenticación' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Formato de token inválido' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRÍTICO: JWT_SECRET no está definido');
      res.status(500).json({ message: 'Error de configuración del servidor' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Validación adicional del payload
    if (!decoded.id || typeof decoded.id !== 'string') {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      role: user.role as 'admin' | 'user'
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expirado' });
      return;
    }
    
    console.error('Error en el middleware de autenticación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Middleware para verificar admin
const ensureAdmin = (req: AuthenticatedRequest, res: Response, next: () => void): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Acceso denegado. Se requiere autenticación.' });
    return;
  }
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
};

// 3. INICIALIZACIÓN DE APP CON TIPO EXPLÍCITO (Fix TS2742)
const app: express.Application = express();

app.use(cors());
app.use(express.json());

const VERIFICATION_CODE_EXPIRATION_MINUTES = 15;

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const isValidEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);

const hashVerificationCode = (code: string): string =>
  crypto.createHash("sha256").update(code).digest("hex");

app.get("/xuper/", (_req, res) => {
  res.send("XUPER Backend is running");
});

app.get('/xuper/users', ensureAuth, ensureAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error en registro:", error.message);
    }
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la lista de usuarios.' });
  }
});

app.post("/xuper/register/admin", ensureAuth, ensureAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const user = await User.create({
      name,
      email: normalizeEmail(email),
      password,
      role: 'admin',
      verified: true,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error en registro:", error.message);
    }
    console.error("Error al registrar administrador:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

const ADMIN_REGISTRATION_CODE = process.env.ADMIN_REGISTRATION_CODE;

app.post("/xuper/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, verificationCode, adminCode } = req.body;

  try {
    if (!name || !email || !password || !verificationCode) {
      res.status(400).json({
        message: "Por favor, completa todos los campos obligatorios e incluye el código de verificación.",
      });
      return;
    }

    const isAdminRegistration = adminCode === ADMIN_REGISTRATION_CODE;

    if (isAdminRegistration) {
      console.log(`Intento de registro de administrador: ${email}`);
    }

    if (password.length < 6) {
      res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Por favor, ingresa un correo electrónico válido." });
      return;
    }

    if (name.length < 2 || name.length > 50) {
      res.status(400).json({ message: "El nombre debe tener entre 2 y 50 caracteres." });
      return;
    }

    if (password.trim().includes(" ")) {
      res.status(400).json({ message: "La contraseña no debe contener espacios." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      res.status(400).json({
        message: "El usuario ya existe con ese correo electrónico.",
      });
      return;
    }

    const verificationEntry = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (!verificationEntry) {
      res.status(400).json({
        message: "No existe un código de verificación para este correo. Solicita uno nuevo.",
      });
      return;
    }

    if (verificationEntry.expiresAt.getTime() < Date.now()) {
      await verificationEntry.deleteOne();
      res.status(400).json({
        message: "El código de verificación ha expirado. Solicita uno nuevo.",
      });
      return;
    }

    const providedCodeHash = hashVerificationCode(String(verificationCode));

    if (providedCodeHash !== verificationEntry.codeHash) {
      res.status(400).json({ message: "Código de verificación inválido." });
      return;
    }

    const role = isAdminRegistration ? 'admin' as const : 'user' as const;
    const userData = {
      name,
      email: normalizedEmail,
      password,
      role,
      verified: true,
    };

    const user = await User.create(userData);
    await verificationEntry.deleteOne();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error en registro:", error.message);
    }
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post("/xuper/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      res.status(400).json({ message: "Por favor, completa todos los campos obligatorios." });
      return;
    }
    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      res.status(401).json({ message: "Correo electrónico o contraseña inválidos." });
      return;
    }

    if (!user.verified) {
      res.status(403).json({
        message: "Tu correo electrónico no ha sido verificado. Completa la verificación para iniciar sesión.",
      });
      return;
    }

    if (await user.matchPassword(password)) {
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '30d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token
      });

    } else {
      res.status(401).json({ message: "Correo electrónico o contraseña inválidos." });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error en registro:", error.message);
    }
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post("/xuper/verify-email", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    if (!email) {
      res.status(400).json({ message: "Por favor, ingresa un correo electrónico." });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Por favor, ingresa un correo electrónico válido." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(400).json({ message: "El correo electrónico ya está registrado." });
      return;
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = hashVerificationCode(verificationCode);
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_MINUTES * 60 * 1000);

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      { codeHash, expiresAt },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    await sendVerificationCodeEmail(normalizedEmail, verificationCode);

    res.status(200).json({
      message: "Se ha enviado un código de verificación al correo electrónico proporcionado.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error en registro:", error.message);
    }
    console.error("Error al verificar el correo electrónico:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get("/xuper/download", ensureAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado. Debe iniciar sesión." });
    return;
  }
  console.log(`Usuario (${req.user.id}) solicitando URLs de descarga.`);
  res.status(200).json({
    xptv: "https://files.thexupertv.com/XPTV-6.5.0-thexupertv.com.apk",
    xprtv: "https://files.thexupertv.com/XPR_Tv%20_thexupertv.com4.34.3.apk"
  });
});

// 4. ESCUCHA SOLO EN LOCAL (NO en Vercel)
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`Server is listening on port http://localhost:${PORT}`); 
  });
}

export default app;
