const { Router } = require("express");
const { crearResolucion } = require("../controllers/resoluciones.controller");

const router = Router();

// Definimos la ruta POST /
// Esto equivale a: POST http://localhost:3000/api/resoluciones/
router.post("/", crearResolucion);

module.exports = router;
