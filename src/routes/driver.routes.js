import { Router } from "express";
// Asegúrate de que el nombre del archivo coincida (resolucionesController.js o resoluciones.controller.js)
import driverController from "../controllers/rodados/driver.controller.js";

import passport from "../middlewares/passport.js";

const { createOne, deleteOne, getAll, getOne } = driverController;

const authMiddleware = passport.authenticate("jwt", { session: false });

const driverRoutes = Router();

driverRoutes.get(["/", "/:search"], getAll);
driverRoutes.post("/", authMiddleware, createOne);
driverRoutes.get("/getone/:id", getOne);
//driverRoutes.delete("/deleteone/:id", deleteOne);

export default driverRoutes;
