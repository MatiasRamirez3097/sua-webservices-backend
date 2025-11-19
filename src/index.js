require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const resolucionesRoutes = require("./routes/resoluciones.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(morgan("dev")); // Ver logs en consola
app.use(cors()); // Permitir peticiones de otros dominios (tu React)
app.use(express.json()); // Entender JSON que viene del Body

// --- Rutas ---
// Todo lo que venga a /api/resoluciones lo maneja este archivo
app.use("/api/resoluciones", resolucionesRoutes);

// --- Servidor ---
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
