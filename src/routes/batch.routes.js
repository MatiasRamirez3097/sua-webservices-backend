import { Router } from "express";
import batchController from "../controllers/sua/batch.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { PERMISSIONS as P } from "../utils/roles.js";

const { cancel, createOne, deleteOne, getAll, getOne, reschedule } =
    batchController;

const canView = requirePermission(P.LOTES_VER);
const canCreate = requirePermission(P.LOTES_CREAR);
// Cancelar / reprogramar: los propios o cualquiera (el controlador revisa
// que el lote sea del usuario si solo tiene "gestionar propios")
const canManage = requirePermission(P.LOTES_GESTIONAR_PROPIOS, P.LOTES_GESTIONAR_TODOS);
const canDelete = requirePermission(P.LOTES_GESTIONAR_TODOS);

const batchRoutes = Router();
batchRoutes.use(requireAuth);

batchRoutes.get("/", canView, getAll);
batchRoutes.get("/getone/:id", canView, getOne);
batchRoutes.post("/", canCreate, createOne);
batchRoutes.patch("/cancel/:id", canManage, cancel);
batchRoutes.patch("/reschedule/:id", canManage, reschedule);
batchRoutes.delete("/deleteone/:id", canDelete, deleteOne);

export default batchRoutes;
