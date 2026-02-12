import { Router } from "express";
// Asegúrate de que el nombre del archivo coincida (resolucionesController.js o resoluciones.controller.js)
import vehicleController from "../controllers/rodados/vehicle.controller.js";

import passport from "../middlewares/passport.js";

const { createOne, deleteOne, getAll, getOne } = vehicleController;

const authMiddleware = passport.authenticate("jwt", { session: false });

const vehicleRoutes = Router();

vehicleRoutes.get(["/", "/:search"], getAll);
vehicleRoutes.post("/", authMiddleware, createOne);
vehicleRoutes.get("/getone/:id", getOne);
//driverRoutes.delete("/deleteone/:id", deleteOne);

export default vehicleRoutes;
