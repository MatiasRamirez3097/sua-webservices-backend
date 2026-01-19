import { Router } from "express";
import authController from "../controllers/auth/auth.controller.js";
import { signUpSchema } from "../validators/signUpValidator.js";
import validator from "../middlewares/validator.js";
import passport from "../middlewares/passport.js";
const { loginWithToken, signIn, signUp } = authController;

const authRoutes = Router();
authRoutes.post("/signin", signIn);
authRoutes.post("/", validator(signUpSchema), signUp);
authRoutes.get(
    "/token",
    passport.authenticate("jwt", { session: false }),
    loginWithToken
);

export default authRoutes;
