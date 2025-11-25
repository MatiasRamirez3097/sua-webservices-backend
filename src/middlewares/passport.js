import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import User from "../models/User.js";
import "dotenv/config.js";

const opt = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY,
};

const fn = async (payload, done) => {
    try {
        const user = await User.findOne({ email: payload.email });
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    } catch (err) {
        return done(err, false);
    }
};

export default passport.use(new Strategy(opt, fn));
