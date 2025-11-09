import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import { User } from "./models/user.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
app.post('/xuper/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {

    //validations
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Por favor, completa todos los campos obligatorios.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      res.status(400).json({ message: 'Por favor, ingresa un correo electrónico válido.' });
      return;
    }

    if (name.length < 2 || name.length > 50) {
      res.status(400).json({ message: 'El nombre debe tener entre 2 y 14 caracteres.' });
      return;
    }

    if (password.trim().includes(' ')) {
      res.status(400).json({ message: 'La contraseña no debe contener espacios.' });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'El usuario ya existe con ese correo electrónico.' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
    });


    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos.' });
    }


  } catch (error: any) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT is not defined in environment variables");
}

app.listen(PORT, () => {
  connectDB();
  console.log("==================================");
  console.log(`Server is running on port http://localhost:${PORT}`);
});
