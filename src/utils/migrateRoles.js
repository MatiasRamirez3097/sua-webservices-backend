import User from "../models/User.js";
import { rolesFromLegacy } from "./roles.js";

/**
 * Pasa los usuarios del esquema de roles anterior (role + permissions por
 * módulo) al actual (isAdmin + suaRole + rodadosRole).
 *
 * Es idempotente: solo toca documentos que todavía tienen los campos viejos,
 * así que se puede ejecutar en cada arranque. Usa la colección directa para
 * incluir a los usuarios eliminados y no depender de las validaciones.
 */
export const migrateLegacyRoles = async ({ log = console.log } = {}) => {
    const legacy = await User.collection
        .find({ $or: [{ role: { $exists: true } }, { permissions: { $exists: true } }] })
        .toArray();

    const changes = [];
    for (const u of legacy) {
        const roles = rolesFromLegacy(u);
        await User.collection.updateOne(
            { _id: u._id },
            { $set: roles, $unset: { role: "", permissions: "" } },
        );
        changes.push({ email: u.email, deleted: !!u.deleted, ...roles });
    }

    if (changes.length) {
        log(`Roles migrados al esquema nuevo: ${changes.length} usuario(s)`);
        for (const c of changes)
            log(
                `  - ${c.email}${c.deleted ? " [eliminado]" : ""}: admin=${c.isAdmin ? "sí" : "no"} sua=${c.suaRole ?? "-"} rodados=${c.rodadosRole ?? "-"}`,
            );
    }
    return changes;
};
