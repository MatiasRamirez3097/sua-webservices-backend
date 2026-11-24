import jwt from "jsonwebtoken";
import "dotenv/config.js";
import { permissionsOf } from "./roles.js";
import { JWT_EXPIRES_IN } from "../middlewares/passport.js";

export const signToken = (user) =>
    jwt.sign({ email: user.email }, process.env.SECRET_KEY, {
        algorithm: "HS256",
        expiresIn: JWT_EXPIRES_IN,
    });

/** Datos del usuario que recibe el front (incluye sus permisos efectivos). */
export const publicUser = (user) => ({
    id: String(user._id),
    email: user.email,
    name: user.name,
    surname: user.surname,
    area: user.area,
    isAdmin: !!user.isAdmin,
    suaRole: user.suaRole ?? null,
    rodadosRole: user.rodadosRole ?? null,
    permissions: permissionsOf(user),
});
