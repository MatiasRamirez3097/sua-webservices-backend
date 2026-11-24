import { Router } from "express";
import vehicleController from "../controllers/rodados/vehicle.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { PERMISSIONS as P } from "../utils/roles.js";

const { createOne, getAll, getOne } = vehicleController;

const vehicleRoutes = Router();
vehicleRoutes.use(requireAuth, requirePermission(P.RODADOS_SOLICITAR, P.RODADOS_FLOTA));

vehicleRoutes.get("/getone/:id", getOne);
vehicleRoutes.get(["/", "/:search"], getAll);
vehicleRoutes.post("/", requirePermission(P.RODADOS_FLOTA), createOne);

export default vehicleRoutes;
