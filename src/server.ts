import crypto from "crypto";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/firebase-config.js";
import { connectDB } from "./config/db.js";
import EmailVerification from "./models/emailVerification.js";
import { User } from "./models/user.js";
import { sendVerificationCodeEmail } from "./services/emailService.js";

dotenv.config();

const app = express();
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

app.get('/xuper/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    // get users from database
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la lista de usuarios.' });
  }
});


//Resgister new user
app.post("/xuper/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, verificationCode } = req.body;

  try {
    if (!name || !email || !password || !verificationCode) {
      res.status(400).json({
        message:
          "Por favor, completa todos los campos obligatorios e incluye el código de verificación.",
      });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    if (!isValidEmail(email)) {
      res
        .status(400)
        .json({ message: "Por favor, ingresa un correo electrónico válido." });
      return;
    }

    if (name.length < 2 || name.length > 50) {
      res
        .status(400)
        .json({ message: "El nombre debe tener entre 2 y 50 caracteres." });
      return;
    }

    if (password.trim().includes(" ")) {
      res
        .status(400)
        .json({ message: "La contraseña no debe contener espacios." });
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
        message:
          "No existe un código de verificación para este correo. Solicita uno nuevo.",
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

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      verified: true,
    });

    await verificationEntry.deleteOne();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

//verify user email
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
      res.status(400).json({
        message: "El correo electrónico ya está registrado.",
      });
      return;
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = hashVerificationCode(verificationCode);
    const expiresAt = new Date(
      Date.now() + VERIFICATION_CODE_EXPIRATION_MINUTES * 60 * 1000,
    );

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      { codeHash, expiresAt },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    await sendVerificationCodeEmail(normalizedEmail, verificationCode);

    res.status(200).json({
      message:
        "Se ha enviado un código de verificación al correo electrónico proporcionado.",
    });
  } catch (error: any) {
    console.error("Error al verificar el correo electrónico:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  } 
});


//Login user
app.post("/xuper/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    //validations
    if (!email || !password) {
      res
        .status(400)
        .json({ message: "Por favor, completa todos los campos obligatorios." });
      return;
    } 
    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      res.status(401).json({
        message: "Correo electrónico o contraseña inválidos.",
      });
      return;
    }

    if (!user.verified) {
      res.status(403).json({
        message:
          "Tu correo electrónico no ha sido verificado. Completa la verificación para iniciar sesión.",
      });
      return;
    }

    if (await user.matchPassword(password)) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(401).json({ message: "Correo electrónico o contraseña inválidos." });
    }
  } catch (error: any) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
  


const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT is not defined in environment variables");
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port http://localhost:${PORT}`);
});
