import { Router } from "express";
import userController from "../controllers/auth/user.controller.js";
const { createOne, softDeleteOne, getAll, getOne, updateOne } = userController;

const userRoutes = Router();

userRoutes.get("/", getAll);
userRoutes.get("/search/:search", getAll);
userRoutes.post("/create", createOne);
userRoutes.get("/getone/:id", getOne);
userRoutes.put("/update/:id", updateOne);
userRoutes.put("/softdelete/:id", softDeleteOne);

export default userRoutes;
