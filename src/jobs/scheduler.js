import cron from "node-cron";
import axios from "axios";
import https from "https";
import Batch from "../models/Batch.js";
import BatchItem from "../models/BatchItem.js";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const cleanText = (text) => {
    if (!text) return "";

    return (
        text
            .toString()
            // 1. Reemplazamos la comilla doble recta (") por la comilla tipográfica de cierre (”)
            // Visualmente es casi igual, pero NO rompe el JSON.
            .replace(/"/g, "\u201D")

            // 2. Opcional: Aseguramos que otras variantes también se unifiquen
            .replace(/“/g, "\u201D")
            .replace(/\n/g, " ")
    );
};
// Helper Strategy Builder
const buildStrategy = (item) => {
    // 1. Desestructuramos los datos del Lote Padre (Batch)
    const { extraData, date, user, processType } = item.batch;

    // 2. Preparamos el Usuario
    // La API externa espera el usuario sin dominio (ej: "mramirez"),
    // pero en la DB tenemos el objeto User completo con email.
    const apiUser = user.email.split("@")[0];

    // 3. Switch según el tipo de proceso
    switch (processType) {
        // --- CASO 1: RESOLVER EXPEDIENTE ---
        case "RESOLUCION":
            return {
                // URL: /solicitudes/resolver/123-2024
                url: `${process.env.ROSARIO_API_URL}/solicitudes/resolver/${item.sua}-${item.year}`,

                payload: {
                    // API Externa (Español) : Tus Datos (Inglés/Genéricos)
                    fecha: date, // Viene de batch.date
                    usuario: apiUser, // El usuario calculado arriba
                    solucion: cleanText(extraData.leyenda), // Mapeamos 'leyenda' a 'solucion'
                    tipo: Number(extraData.tipoResolucion), // Aseguramos que sea número (0, 1, 2)
                    id_area: 2098, // Hardcodeado o variable según necesites
                    id_motivo_cierre: Number(extraData.id_motivo_cierre),
                    image: "", // Campo obligatorio aunque vaya vacío
                },
            };

        // --- CASO 2: AGREGAR INTERVENCIÓN ---
        case "INTERVENCION":
            return {
                // URL: /intervenciones/agregar/123-2024
                url: `${process.env.ROSARIO_API_URL}/intervenciones/agregar/${item.sua}-${item.year}`,

                payload: {
                    fecha: date,
                    usuario: apiUser,
                    observacion: extraData.observacion, // Asumimos que el front mandó 'observacion'
                    id_tipo_intervencion: Number(extraData.idTipoIntervencion),
                    // Agrega aquí otros campos si la API de intervenciones los pide (ej: id_area)
                    id_area: 2098,
                },
            };

        // --- CASO 3: ASIGNAR A EQUIPO ---
        case "ASIGNACION":
            return {
                // URL: /solicitudes/asignar/123-2024
                url: `${process.env.ROSARIO_API_URL}/solicitudes/asignar/${item.sua}-${item.year}`,

                payload: {
                    // OJO: Verifica si la API pide 'usuario' o 'usuario_asignador'
                    usuario_asignador: apiUser,
                    id_equipo_destino: Number(extraData.idEquipo),
                    observacion: extraData.observacion || "",
                },
            };

        default:
            throw new Error(`Unknown Process Type: ${processType}`);
    }
};

export const startScheduler = () => {
    // Ejecutar cada 5 minutos (o 15, o 1).
    // "*/5 * * * *" significa "cada minuto divisible por 5"
    cron.schedule("*/5 * * * *", async () => {
        console.log("⏱️  Checking schedule...");
        const now = new Date();

        // 1. LA CONSULTA MÁGICA
        // Buscar lotes que:
        // A) Estén PENDIENTES
        // B) Su hora programada sea MENOR O IGUAL (lte) a Ahora.
        const batches = await Batch.find({
            status: "PENDING",
            scheduledAt: { $lte: now },
        });

        if (batches.length === 0) return;

        console.log(`🚀 Starting ${batches.length} batches...`);

        // 2. Procesar Lotes
        for (const batch of batches) {
            // Marcar como PROCESANDO para que no lo tome la próxima vuelta del cron
            batch.status = "PROCESSING";
            await batch.save();

            // Buscar Items
            const items = await BatchItem.find({
                batch: batch._id,
                status: "PENDING",
            }).populate({
                path: "batch",
                populate: { path: "user", model: "users" },
            });

            // Procesar Items
            for (const item of items) {
                try {
                    const { url, payload } = buildStrategy(item);
                    console.log(url);
                    console.log(payload);
                    const res = await axios.post(url, payload, {
                        headers: {
                            "X-Gravitee-Api-Key": process.env.ROSARIO_API_KEY,
                            "Content-Type": "application/json; charset=utf-8",
                        },
                        proxy: false,
                        httpsAgent,
                    });

                    item.status = "SUCCESS";
                    item.apiResponse = res.data;
                    item.processedAt = new Date();
                    console.log("llego");
                    await Batch.findByIdAndUpdate(batch._id, {
                        $inc: { processed: 1 },
                    });
                } catch (error) {
                    item.status = "ERROR";
                    item.errorDetail =
                        error.response?.data.detail ||
                        "Error interno del servidor";
                    item.processedAt = new Date();

                    await Batch.findByIdAndUpdate(batch._id, {
                        $inc: { processed: 1, errorsCount: 1 },
                    });
                }
                await item.save();
                await new Promise((r) => setTimeout(r, 200)); // Pausa
            }

            // Marcar Lote como FINALIZADO
            batch.status = "COMPLETED";
            await batch.save();
            console.log(`🏁 Batch #${batch._id} finished.`);
        }
    });

    console.log("✅ Scheduler Service Started (Polling every 5 mins)");
};
