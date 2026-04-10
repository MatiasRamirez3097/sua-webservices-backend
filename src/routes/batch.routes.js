import { Router } from "express";
// Asegúrate de que el nombre del archivo coincida (resolucionesController.js o resoluciones.controller.js)
import batchController from "../controllers/sua/batch.controller.js";

import passport from "../middlewares/passport.js";

const { createOne, deleteOne, getAll, getOne, reschedule, cancel } =
    batchController;

const authMiddleware = passport.authenticate("jwt", { session: false });

const batchRoutes = Router();

batchRoutes.get(["/", "/:search"], getAll);
batchRoutes.post("/", authMiddleware, createOne);
batchRoutes.get("/getone/:id", getOne);
batchRoutes.patch("/reschedule/:id", authMiddleware, reschedule);
batchRoutes.delete("/deleteone/:id", authMiddleware, deleteOne);
batchRoutes.patch("/cancel/:id", authMiddleware, cancel);

export default batchRoutes;
