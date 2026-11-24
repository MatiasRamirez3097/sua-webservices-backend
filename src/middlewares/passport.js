import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import User from "../models/User.js";
import "dotenv/config.js";

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

const opt = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY,
    algorithms: ["HS256"],
    // maxAge valida la antigüedad por `iat`: también invalida los tokens
    // viejos que se emitieron sin fecha de expiración.
    jsonWebTokenOptions: { maxAge: JWT_EXPIRES_IN },
};

const fn = async (payload, done) => {
    try {
        const user = await User.findOne({ email: payload.email });
        if (!user) return done(null, false);

        // Si la contraseña cambió después de emitido el token, el token deja de valer
        if (
            user.passwordChangedAt &&
            payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000
        ) {
            return done(null, false);
        }
        return done(null, user);
    } catch (err) {
        return done(err, false);
    }
};

export default passport.use(new Strategy(opt, fn));
