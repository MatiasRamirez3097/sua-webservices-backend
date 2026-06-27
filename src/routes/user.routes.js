import { Router } from "express";
import passport from "passport";
import userController from "../controllers/auth/user.controller.js";
const { createOne, softDeleteOne, getAll, getOne, updateOne, changePassword } =
    userController;

const userRoutes = Router();

userRoutes.get("/", getAll);
userRoutes.get("/search/:search", getAll);
userRoutes.post("/create", createOne);
userRoutes.get("/getone/:id", getOne);
userRoutes.put("/update/:id", updateOne);
userRoutes.put("/softdelete/:id", softDeleteOne);
userRoutes.put(
    "/changepassword",
    passport.authenticate("jwt", { session: false }),
    changePassword,
);

export default userRoutes;
