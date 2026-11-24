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

//IMPORT RODADOS ROUTERS
import driverRoutes from "./routes/driver.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";

import "./config/database.js";

import { startScheduler } from "./jobs/scheduler.js";

// Configurar variables de entorno
dotenv.config();

if (!process.env.SECRET_KEY || process.env.SECRET_KEY.length < 16) {
    console.error(
        "❌ SECRET_KEY no está definida o es demasiado corta (mínimo 16 caracteres).",
    );
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
// Si el backend queda detrás de un proxy/reverse proxy, setear TRUST_PROXY=1
// para que req.ip (usado por el límite de intentos de login) sea el real.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

// --- CORS ---
// CORS_ORIGIN: lista separada por comas (ej: "https://sua.rosario.gob.ar").
// Sin definir, se permite cualquier origen (solo recomendable en desarrollo).
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
if (allowedOrigins.length === 0) {
    console.warn("⚠️  CORS_ORIGIN no definido: se aceptan peticiones de cualquier origen.");
}
app.use(
    cors({
        origin: allowedOrigins.length ? allowedOrigins : true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

// --- Headers de seguridad básicos ---
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    next();
});

// --- Middlewares ---
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(passport.initialize());

// --- Rutas ---
app.use("/api/batches", batchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rodados/drivers", driverRoutes);
app.use("/api/rodados/owners", ownerRoutes);
app.use("/api/rodados/vehicles", vehicleRoutes);

// 404 para rutas de la API inexistentes
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, error: "Recurso no encontrado" });
});

// Manejador de errores: nunca devolvemos stack traces al cliente
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err?.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, error: "JSON inválido" });
    }
    if (err?.type === "entity.too.large") {
        return res.status(413).json({ success: false, error: "El archivo es demasiado grande" });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
});

// jobs
startScheduler();

// --- Servidor ---
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
