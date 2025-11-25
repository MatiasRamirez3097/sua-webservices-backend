import { Router } from "express";
import authController from "../controllers/authController.js";
import { signUpSchema } from "../validators/signUpValidator.js";
import validator from "../middlewares/validator.js";
import passport from "../middlewares/passport.js";
const { loginWithToken, signIn, signUp } = authController;

const authRouter = Router();
authRouter.post("/signin", signIn);
authRouter.post("/", validator(signUpSchema), signUp);
authRouter.get(
    "/token",
    passport.authenticate("jwt", { session: false }),
    loginWithToken
);

export default authRouter;
