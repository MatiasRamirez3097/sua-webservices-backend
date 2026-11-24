/**
 * Herramienta de consola para administrar usuarios directamente en la base.
 * Sirve en el servidor para crear el primer admin o destrabar usuarios.
 *
 *   node scripts/user-admin.js list                       Lista usuarios (incluye eliminados)
 *   node scripts/user-admin.js create <email> [--admin]   Crea un usuario (pide nombre, apellido y contraseña)
 *   node scripts/user-admin.js reset-password <email>     Blanquea la contraseña
 *   node scripts/user-admin.js set-role <email> <sistema> <rol|none>
 *        sistema sua:     consulta | operador | supervisor
 *        sistema rodados: solicitante | encargado
 *        (none = sin acceso a ese sistema)
 *   node scripts/user-admin.js set-area <email> "<area>"  Asigna el área (necesaria para solicitantes)
 *   node scripts/user-admin.js set-admin <email> <si|no>  Da o quita el rol de administrador
 *   node scripts/user-admin.js delete <email>             Eliminación lógica (recuperable)
 *   node scripts/user-admin.js restore <email>            Recupera un usuario eliminado
 *   node scripts/user-admin.js migrate-roles              Pasa usuarios del esquema de roles viejo
 *                                                         (el servidor también lo hace al arrancar)
 *
 * Las contraseñas se piden por consola (no se muestran ni quedan en el
 * historial) y deben cumplir la misma política que la web.
 */
import "dotenv/config.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "readline";
import User from "../src/models/User.js";
import { validatePassword } from "../src/utils/password.util.js";
import { RODADOS_ROLES, SUA_ROLES } from "../src/utils/roles.js";
import { migrateLegacyRoles } from "../src/utils/migrateRoles.js";

const SYSTEM_ROLES = { sua: Object.keys(SUA_ROLES), rodados: Object.keys(RODADOS_ROLES) };
const AREAS = User.schema.path("area").enumValues.filter(Boolean);

const ask = (question, { hidden = false } = {}) =>
    new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });
        let muted = false;
        rl._writeToOutput = (str) => {
            if (!muted || str.includes(question)) rl.output.write(str);
        };
        rl.question(question, (answer) => {
            rl.close();
            if (hidden) process.stdout.write("\n");
            resolve(answer.trim());
        });
        muted = hidden;
    });

const askNewPassword = async () => {
    console.log("Requisitos: 8 a 64 caracteres, mayúscula, minúscula, número, carácter especial y sin espacios.");
    const password = await ask("Contraseña: ", { hidden: true });
    const error = validatePassword(password);
    if (error) throw new Error(error);
    const confirm = await ask("Repetila: ", { hidden: true });
    if (password !== confirm) throw new Error("Las contraseñas no coinciden.");
    return bcrypt.hashSync(password, 10);
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const emailQuery = (email) => {
    if (!email) throw new Error("Falta el email.");
    return { email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" } };
};

// findOneWithDeleted incluye los eliminados lógicamente (mongoose-delete)
const findUser = async (email, { withDeleted = false } = {}) => {
    const user = withDeleted
        ? await User.findOneWithDeleted(emailQuery(email))
        : await User.findOne(emailQuery(email));
    if (!user) throw new Error(`No existe un usuario activo con email ${email}`);
    return user;
};

const describe = (u) =>
    `${u.email}  (${u.name} ${u.surname})  admin=${u.isAdmin ? "sí" : "no"}  sua=${u.suaRole ?? "-"}  rodados=${u.rodadosRole ?? "-"}  área=${u.area ?? "-"}${u.deleted ? "  [ELIMINADO]" : ""}`;

const commands = {
    async list() {
        const users = await User.findWithDeleted({}).sort({ deleted: 1, email: 1 }).lean();
        if (!users.length) return console.log("No hay usuarios.");
        users.forEach((u) => console.log(`- ${describe(u)}`));
    },

    async create(email, flag) {
        if (!email) throw new Error("Uso: create <email> [--admin]");
        const exists = await User.findOneWithDeleted(emailQuery(email));
        if (exists)
            throw new Error(
                exists.deleted
                    ? `Ya existe y está eliminado: usá "restore ${email}".`
                    : "Ya existe un usuario con ese email.",
            );
        const name = await ask("Nombre: ");
        const surname = await ask("Apellido: ");
        if (!name || !surname) throw new Error("Nombre y apellido son obligatorios.");
        const password = await askNewPassword();
        const user = await User.create({
            email: email.trim(),
            name,
            surname,
            password,
            isAdmin: flag === "--admin",
        });
        console.log(`✅ Creado: ${describe(user)}`);
        if (!user.isAdmin)
            console.log('   Asignale roles con "set-role" o desde la pantalla Usuarios.');
    },

    async "reset-password"(email) {
        const user = await findUser(email);
        console.log(`Blanqueo de contraseña para ${user.email}`);
        const hash = await askNewPassword();
        await User.updateOne({ _id: user._id }, { password: hash, passwordChangedAt: new Date() });
        console.log("✅ Contraseña actualizada. Las sesiones abiertas de este usuario se cerraron.");
    },

    async "set-role"(email, system, role) {
        if (!SYSTEM_ROLES[system]) throw new Error("Sistema inválido. Opciones: sua, rodados");
        if (role !== "none" && !SYSTEM_ROLES[system].includes(role))
            throw new Error(`Rol inválido. Opciones: ${SYSTEM_ROLES[system].join(", ")}, none`);
        const user = await findUser(email);
        const value = role === "none" ? null : role;
        if (system === "rodados" && value === "solicitante" && !user.area)
            throw new Error('El usuario no tiene área: asignala primero con "set-area".');
        await User.updateOne({ _id: user._id }, { [`${system}Role`]: value });
        console.log(`✅ ${describe({ ...user.toObject(), [`${system}Role`]: value })}`);
    },

    async "set-area"(email, area) {
        if (!AREAS.includes(area)) throw new Error(`Área inválida. Opciones:${AREAS.map((a) => `
  ${a}`).join("")}`);
        const user = await findUser(email);
        await User.updateOne({ _id: user._id }, { area });
        console.log(`✅ ${describe({ ...user.toObject(), area })}`);
    },

    async "set-admin"(email, value) {
        if (!["si", "no"].includes(value)) throw new Error("Uso: set-admin <email> <si|no>");
        const user = await findUser(email);
        await User.updateOne({ _id: user._id }, { isAdmin: value === "si" });
        console.log(`✅ ${user.email} ${value === "si" ? "ahora es" : "ya no es"} administrador.`);
    },

    async delete(email) {
        const user = await findUser(email);
        const confirm = await ask(`¿Eliminar a ${user.email}? Escribí "si" para confirmar: `);
        if (confirm.toLowerCase() !== "si") return console.log("Cancelado.");
        await User.delete({ _id: user._id });
        console.log(`✅ ${user.email} eliminado (se puede recuperar con "restore").`);
    },

    async restore(email) {
        const user = await findUser(email, { withDeleted: true });
        if (!user.deleted) return console.log(`${user.email} no está eliminado.`);
        await User.restore({ _id: user._id });
        console.log(`✅ ${user.email} recuperado.`);
    },

    async "migrate-roles"() {
        const changes = await migrateLegacyRoles();
        if (!changes.length) console.log("No había usuarios con el esquema de roles viejo.");
    },
};

const [command, ...args] = process.argv.slice(2);

if (!commands[command]) {
    const doc = (await import("fs")).readFileSync(new URL(import.meta.url), "utf8");
    console.log(doc.slice(doc.indexOf("/**"), doc.indexOf("*/") + 2));
    process.exit(command ? 1 : 0);
}

try {
    await mongoose.connect(process.env.DATABASE_URL);
    await commands[command](...args);
} catch (err) {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
