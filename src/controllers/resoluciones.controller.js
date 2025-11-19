const axios = require("axios");
const https = require("https");

const crearResolucion = async (req, res) => {
    const { sua, anio, solucion } = req.body;

    // Validamos datos básicos
    if (!sua || !anio) {
        return res.status(400).json({ error: "Faltan datos: sua o anio" });
    }

    try {
        // 2. Preparamos el cuerpo para la API de Rosario
        const payload = {
            fecha: "15/11/2025 07:00:00", // Podrías usar new Date() aquí
            tipo: 1,
            solucion: solucion || "",
            usuario: "mramire7",
            id_area: 2098,
            id_motivo_cierre: 0,
            image: "",
        };

        // 3. Enviamos la petición a la API REAL (usando las variables de entorno)
        const urlDestino = `${process.env.ROSARIO_API_URL}/solicitudes/resolver/${sua}-${anio}`;

        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        console.log(`Enviando a: ${urlDestino}`);

        const respuestaExterna = await axios.post(urlDestino, payload, {
            headers: {
                "X-Gravitee-Api-Key": process.env.ROSARIO_API_KEY,
                "Content-Type": "application/json",
            },
            proxy: false,
            httpsAgent: httpsAgent,
        });

        // 4. Devolvemos el éxito a React
        return res.status(200).json(respuestaExterna.data);
    } catch (error) {
        console.error("Error en API Rosario:", error.message);

        // Manejo de error seguro
        const status = error.response ? error.response.status : 500;
        console.log(error.response);
        const data = error.response
            ? error.response.data
            : { error: "Error interno del servidor" };

        return res.status(status).json(data);
    }
};

module.exports = { crearResolucion };
