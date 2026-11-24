import { Router } from "express";
import userController from "../controllers/auth/user.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

const { createOne, softDeleteOne, getAll, getOne, updateOne, changePassword } =
    userController;

const userRoutes = Router();
userRoutes.use(requireAuth);

// Cualquier usuario logueado puede cambiar SU propia contraseña
userRoutes.put("/changepassword", changePassword);

// El resto de la gestión de usuarios es solo para administradores
userRoutes.use(requireAdmin);
userRoutes.get("/", getAll);
userRoutes.get("/search/:search", getAll);
userRoutes.post("/create", createOne);
userRoutes.get("/getone/:id", getOne);
userRoutes.put("/update/:id", updateOne);
userRoutes.put("/softdelete/:id", softDeleteOne);

export default userRoutes;
