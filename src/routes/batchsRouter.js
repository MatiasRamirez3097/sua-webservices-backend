import { Router } from "express";
// Asegúrate de que el nombre del archivo coincida (resolucionesController.js o resoluciones.controller.js)
import batchsController from "../controllers/batchsController.js";

import passport from "../middlewares/passport.js";

const { createOne, deleteOne, getAll, getOne, reschedule } = batchsController;

const authMiddleware = passport.authenticate("jwt", { session: false });

const batchsRouter = Router();

batchsRouter.get(["/", "/:search"], getAll);
batchsRouter.post("/", authMiddleware, createOne);
batchsRouter.get("/getone/:id", getOne);
batchsRouter.patch("/reschedule/:id", reschedule);
batchsRouter.delete("/deleteone/:id", deleteOne);

export default batchsRouter;
