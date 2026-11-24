import { Router } from "express";
import driverController from "../controllers/rodados/driver.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { PERMISSIONS as P } from "../utils/roles.js";

const { createOne, getAll, getOne } = driverController;

const driverRoutes = Router();
driverRoutes.use(requireAuth, requirePermission(P.RODADOS_SOLICITAR, P.RODADOS_FLOTA));

driverRoutes.get("/getone/:id", getOne);
driverRoutes.get(["/", "/:search"], getAll);
driverRoutes.post("/", requirePermission(P.RODADOS_FLOTA), createOne);

export default driverRoutes;
