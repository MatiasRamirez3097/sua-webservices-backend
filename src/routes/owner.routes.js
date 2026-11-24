import { Router } from "express";
import ownerController from "../controllers/rodados/owner.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { PERMISSIONS as P } from "../utils/roles.js";

const { createOne, getAll, getOne } = ownerController;

const ownerRoutes = Router();
ownerRoutes.use(requireAuth, requirePermission(P.RODADOS_SOLICITAR, P.RODADOS_FLOTA));

ownerRoutes.get("/getone/:id", getOne);
ownerRoutes.get(["/", "/:search"], getAll);
ownerRoutes.post("/", requirePermission(P.RODADOS_FLOTA), createOne);

export default ownerRoutes;
