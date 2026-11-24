/**
 * Crea (o regenera) un usuario de prueba "operador" para QA local.
 * Las credenciales quedan en scripts/qa-user.local.json (no subir al repo).
 *   node scripts/seed-qa-user.js
 */
import "dotenv/config.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import User from "../src/models/User.js";

const email = "qa.operador@test.local";
const password = `Qa-${crypto.randomBytes(6).toString("hex")}!A1`;

await mongoose.connect(process.env.DATABASE_URL);
await User.findOneAndUpdateDeleted?.({ email }, { deleted: false });
await User.findOneAndUpdate(
    { email },
    {
        email,
        name: "QA",
        surname: "Operador",
        password: bcrypt.hashSync(password, 10),
        passwordChangedAt: new Date(Date.now() - 1000),
        isAdmin: false,
        suaRole: "operador",
        rodadosRole: null,
    },
    { upsert: true, new: true },
);
fs.writeFileSync(
    new URL("./qa-user.local.json", import.meta.url),
    JSON.stringify({ email, password }, null, 2),
);
console.log(`Usuario QA listo: ${email} (credenciales en scripts/qa-user.local.json)`);
await mongoose.disconnect();
