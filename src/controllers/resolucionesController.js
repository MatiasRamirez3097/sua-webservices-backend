import axios from "axios";
import https from "https";
import { formatDateForApi } from "../utils/dataFormatter.js";

export const crearResolucion = async (req, res) => {
    const { fecha, sua, anio, solucion } = req.body;

    const formatedDate = formatDateForApi(fecha);

    const userApi = req.user.email.split("@")[0];

    // Validamos datos básicos
    if (!sua || !anio) {
        return res.status(400).json({ error: "Faltan datos: sua o anio" });
    }

    try {
        // 2. Preparamos el cuerpo para la API de Rosario
        const payload = {
            fecha: formatedDate, // Considera usar new Date().toISOString() o similar si necesitas dinamismo
            tipo: 1,
            solucion: solucion || "",
            usuario: userApi,
            id_area: 2098,
            id_motivo_cierre: 0,
            image: "",
        };

        // 3. Enviamos la petición a la API REAL
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

        if (error.response) {
            console.log("Detalle error externo:", error.response.data);
        }

        const data = error.response?.data || {
            error: "Error interno del servidor",
        };

        return res.status(status).json(data);
    }
};
