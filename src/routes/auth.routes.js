import { Router } from "express";
import authController from "../controllers/auth/auth.controller.js";
import { signUpSchema } from "../validators/signUpValidator.js";
import validator from "../middlewares/validator.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
const { loginWithToken, signIn, signUp } = authController;

const authRoutes = Router();
authRoutes.post("/signin", signIn);
// Antes era un registro público: ahora solo un admin puede dar de alta usuarios
authRoutes.post("/", requireAuth, requireAdmin, validator(signUpSchema), signUp);
authRoutes.get("/token", requireAuth, loginWithToken);

export default authRoutes;
