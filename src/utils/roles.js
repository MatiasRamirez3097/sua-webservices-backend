/**
 * Roles y permisos del sistema (única fuente de verdad).
 *
 * Cada usuario tiene un rol por sistema (SUA y Rodados) y, aparte, puede ser
 * administrador. Las rutas no preguntan por nombres de rol sino por permisos
 * concretos: para cambiar qué puede hacer un rol alcanza con tocar este archivo.
 */

export const PERMISSIONS = {
    LOTES_VER: "lotes.ver",
    LOTES_CREAR: "lotes.crear",
    LOTES_GESTIONAR_PROPIOS: "lotes.gestionar_propios", // cancelar / reprogramar los propios
    LOTES_GESTIONAR_TODOS: "lotes.gestionar_todos", // cancelar / reprogramar / eliminar cualquiera
    RODADOS_SOLICITAR: "rodados.solicitar",
    RODADOS_VER_AREA: "rodados.ver_area",
    RODADOS_VER_TODO: "rodados.ver_todo",
    RODADOS_ASIGNAR: "rodados.asignar",
    RODADOS_FLOTA: "rodados.flota", // vehículos, choferes y propietarios
    USUARIOS_ADMINISTRAR: "usuarios.administrar",
};

const P = PERMISSIONS;

export const SUA_ROLES = {
    consulta: [P.LOTES_VER],
    operador: [P.LOTES_VER, P.LOTES_CREAR, P.LOTES_GESTIONAR_PROPIOS],
    supervisor: [P.LOTES_VER, P.LOTES_CREAR, P.LOTES_GESTIONAR_PROPIOS, P.LOTES_GESTIONAR_TODOS],
};

export const RODADOS_ROLES = {
    solicitante: [P.RODADOS_SOLICITAR, P.RODADOS_VER_AREA],
    encargado: [
        P.RODADOS_SOLICITAR,
        P.RODADOS_VER_AREA,
        P.RODADOS_VER_TODO,
        P.RODADOS_ASIGNAR,
        P.RODADOS_FLOTA,
    ],
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/** Lista de permisos efectivos de un usuario. */
export const permissionsOf = (user) => {
    if (!user) return [];
    if (user.isAdmin) return [...ALL_PERMISSIONS];
    return [
        ...new Set([
            ...(SUA_ROLES[user.suaRole] ?? []),
            ...(RODADOS_ROLES[user.rodadosRole] ?? []),
        ]),
    ];
};

export const can = (user, permission) => permissionsOf(user).includes(permission);

// ─── Conversión desde el esquema anterior ─────────────────────────────────────
// Antes: role ("admin" | "fiscalizado") + permissions [{ module, role }] con
// module gestionsua | estadocargas | rodados y role manager | operator | viewer.

const SUA_RANK = ["consulta", "operador", "supervisor"];
const LEGACY_SUA = { viewer: "consulta", operator: "operador", manager: "supervisor" };
const LEGACY_RODADOS = { viewer: "solicitante", operator: "solicitante", manager: "encargado" };

/** Calcula los campos nuevos a partir de los viejos. */
export const rolesFromLegacy = ({ role, permissions } = {}) => {
    const perms = Array.isArray(permissions) ? permissions : [];

    // El rol más alto entre Gestión SUA y Estado de cargas
    let suaRole = null;
    for (const p of perms) {
        if (!["gestionsua", "estadocargas"].includes(p?.module)) continue;
        const r = LEGACY_SUA[p?.role];
        if (r && SUA_RANK.indexOf(r) > SUA_RANK.indexOf(suaRole)) suaRole = r;
    }

    const rodadosPerm = perms.find((p) => p?.module === "rodados" && LEGACY_RODADOS[p?.role]);
    let rodadosRole = rodadosPerm ? LEGACY_RODADOS[rodadosPerm.role] : null;
    // "fiscalizado" veía todos los pedidos de rodados
    if (role === "fiscalizado") rodadosRole = "encargado";

    return { isAdmin: role === "admin", suaRole, rodadosRole };
};
