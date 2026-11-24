import mongoose from "mongoose";
import "dotenv/config.js";
import { migrateLegacyRoles } from "../utils/migrateRoles.js";

mongoose
    .connect(process.env.DATABASE_URL)
    .then(async () => {
        console.log("Database connected");
        // Convierte usuarios con el esquema de roles anterior (no hace nada si no hay)
        await migrateLegacyRoles().catch((err) =>
            console.error("No se pudieron migrar los roles:", err.message),
        );
    })
    .catch(() => {
        console.log("Connection failed");
    });
