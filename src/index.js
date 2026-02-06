import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import passport from "passport";

import "./middlewares/passport.js";

// IMPORTANTE: En "type": "module", es OBLIGATORIO poner la extensión .js
// al importar tus propios archivos.
import batchRoutes from "./routes/batch.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import "./config/database.js";

import { startScheduler } from "./jobs/scheduler.js";
//import { dbConnection } from "./database/config.js"; // Si ya creaste la config de DB

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Conectar a BD (Si ya tienes el archivo creado) ---
// dbConnection();

// --- Middlewares ---
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// --- Rutas ---
app.use("/api/batches", batchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// jobs
startScheduler();

// --- Servidor ---
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
