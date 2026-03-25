import { Router } from "express";
// Asegúrate de que el nombre del archivo coincida (resolucionesController.js o resoluciones.controller.js)
import ownerController from "../controllers/rodados/owner.controller.js";

import passport from "../middlewares/passport.js";

const { createOne, deleteOne, getAll, getOne } = ownerController;

const authMiddleware = passport.authenticate("jwt", { session: false });

const ownerRoutes = Router();

ownerRoutes.get(["/", "/:search"], getAll);
ownerRoutes.post("/", authMiddleware, createOne);
ownerRoutes.get("/getone/:id", getOne);
//driverRoutes.delete("/deleteone/:id", deleteOne);

export default ownerRoutes;
