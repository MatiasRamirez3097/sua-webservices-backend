import { permissionsOf } from "../utils/roles.js";
import passport from "./passport.js";

/** Requiere un JWT válido (Authorization: Bearer <token>). */
export const requireAuth = (req, res, next) =>
    passport.authenticate("jwt", { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Sesión inválida o expirada",
                code: "UNAUTHORIZED",
            });
        }
        req.user = user;
        return next();
    })(req, res, next);

const forbidden = (res) =>
    res.status(403).json({
        success: false,
        error: "No tenés permisos para realizar esta acción",
        code: "FORBIDDEN",
    });

/** Solo administradores (usar después de requireAuth). */
export const requireAdmin = (req, res, next) =>
    req.user?.isAdmin ? next() : forbidden(res);

/**
 * Requiere al menos uno de los permisos indicados (ver utils/roles.js).
 * Los administradores tienen todos.
 *
 *   requirePermission(PERMISSIONS.LOTES_CREAR)
 */
export const requirePermission =
    (...permissions) =>
    (req, res, next) => {
        const own = permissionsOf(req.user);
        return permissions.some((p) => own.includes(p)) ? next() : forbidden(res);
    };
