import { Router } from "express";
// Asegúrate de que el nombre del archivo coincida (resolucionesController.js o resoluciones.controller.js)
import { crearResolucion } from "../controllers/resolucionesController.js";

import passport from "../middlewares/passport.js";

const authMiddleware = passport.authenticate("jwt", { session: false });

const resolucionesRouter = Router();

// Definimos la ruta POST /
// Esto equivale a: POST http://localhost:3000/api/resoluciones/
resolucionesRouter.post("/", authMiddleware, crearResolucion);

export default resolucionesRouter;
