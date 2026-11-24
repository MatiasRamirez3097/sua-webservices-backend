import cron from "node-cron";
import axios from "axios";
import https from "https";
import Batch from "../models/Batch.js";
import BatchItem from "../models/BatchItem.js";
import { toSuaApiDateTime } from "../utils/date.util.js";

// TODO seguridad: el gateway de testing usa un certificado no confiable.
// En producción conviene habilitar la verificación TLS.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const API_TIMEOUT_MS = 30_000;

const cleanText = (text) => {
    if (!text) return "";

    return (
        text
            .toString()
            // Reemplazamos comillas dobles por la tipográfica de cierre (”):
            // visualmente igual pero no rompe el JSON del lado de la API.
            .replace(/"/g, "”")
            .replace(/“/g, "”")
            .replace(/\n/g, " ")
    );
};

/**
 * Id de la solicitud en la API SUA v2.
 * Los ítems viejos (formato SUA + año) no tienen id: no se pueden mapear
 * automáticamente, así que se marcan con error para recargarlos.
 */
const getRequestId = (item) => {
    const id = String(item.requestId ?? "").trim();
    if (!/^\d+$/.test(id)) {
        throw new Error(
            item.sua
                ? `Registro en formato SUA-año (${item.sua}-${item.year}); volvé a cargarlo usando el id de la solicitud.`
                : "El registro no tiene un id de solicitud válido.",
        );
    }
    return encodeURIComponent(id);
};

const solicitudUrl = (item, action) =>
    `${process.env.ROSARIO_API_URL}/solicitudes/${getRequestId(item)}/${action}`;

// Construye URL + body según el tipo de proceso del lote
export const buildStrategy = (item) => {
    const { extraData = {}, date, idArea, processType } = item.batch;
    const solucion = cleanText(extraData.legend ?? extraData.leyenda);

    switch (processType) {
        // PUT /v2/solicitudes/{id}/resolver  (sin archivos adjuntos)
        // body: { idArea: integer, fecha: "yyyy-MM-dd HH:mm:ss", solucion: string }
        case "RESOLUCION": {
            const areaId = Number(idArea);
            if (!Number.isInteger(areaId)) {
                throw new Error(`idArea inválido en el lote: "${idArea}"`);
            }
            return {
                url: solicitudUrl(item, "resolver"),
                payload: {
                    idArea: areaId,
                    fecha: toSuaApiDateTime(date),
                    solucion,
                },
            };
        }

        // PUT /v2/solicitudes/{id}/derivar
        // Si existe una derivación vigente, la API la resuelve parcialmente y rederiva.
        // body: { idAreaDerivada: integer, solucion: string }
        case "DERIVACION": {
            const destino = Number(
                extraData.idAreaDerivada ?? extraData.id_area_derivada,
            );
            if (!Number.isInteger(destino)) {
                throw new Error(
                    `Área de destino inválida en el lote: "${extraData.idAreaDerivada}"`,
                );
            }
            return {
                url: solicitudUrl(item, "derivar"),
                payload: { idAreaDerivada: destino, solucion },
            };
        }

        // INTERVENCION / ASIGNACION todavía no tienen endpoint definido en la API v2
        default:
            throw new Error(
                `Tipo de proceso no soportado por la API v2: ${processType}`,
            );
    }
};

// La API confirma que la resolución / derivación se aplicó respondiendo
// exactamente HTTP 200 OK. Cualquier otro código (incluidos otros 2xx o
// redirecciones) se registra como error con el detalle que devuelva.
const SUCCESS_STATUS = 200;

const extractErrorDetail = (error) => {
    const data = error.response?.data;
    const detail =
        data?.detail ||
        data?.message ||
        data?.error ||
        (typeof data === "string" && data.trim() ? data.trim().slice(0, 300) : null) ||
        error.message ||
        "Error interno del servidor";
    const status = error.response?.status;
    return status ? `[${status}] ${detail}` : detail;
};

export const processBatch = async (batch) => {
    const items = await BatchItem.find({
        batch: batch._id,
        status: "PENDING",
    }).populate("batch");

    for (const item of items) {
        try {
            const { url, payload } = buildStrategy(item);
            console.log(`→ PUT ${url}`);
            const res = await axios.put(url, payload, {
                headers: {
                    "X-Gravitee-Api-Key": process.env.ROSARIO_API_KEY,
                    "Content-Type": "application/json; charset=utf-8",
                },
                proxy: false,
                httpsAgent,
                timeout: API_TIMEOUT_MS,
                maxRedirects: 0, // una redirección no confirma nada
                validateStatus: () => true, // el código lo evaluamos nosotros
            });

            if (res.status !== SUCCESS_STATUS) {
                const err = new Error(
                    res.status >= 200 && res.status < 400
                        ? "La API no confirmó la operación (se esperaba 200 OK)"
                        : "Error de la API",
                );
                err.response = res;
                throw err;
            }

            item.status = "SUCCESS";
            item.apiResponse = res.data;
            item.processedAt = new Date();
            await Batch.updateOne({ _id: batch._id }, { $inc: { processed: 1 } });
        } catch (error) {
            item.status = "ERROR";
            item.errorDetail = extractErrorDetail(error);
            item.processedAt = new Date();
            await Batch.updateOne(
                { _id: batch._id },
                { $inc: { processed: 1, errorsCount: 1 } },
            );
        }
        await item.save();
        await new Promise((r) => setTimeout(r, 200)); // Pausa entre llamadas
    }

    await Batch.updateOne({ _id: batch._id }, { status: "COMPLETED" });
    console.log(`🏁 Batch #${batch._id} finished.`);
};

let running = false;

export const startScheduler = () => {
    // Cada 5 minutos
    cron.schedule("*/5 * * * *", async () => {
        if (running) return; // la vuelta anterior todavía está procesando
        running = true;
        try {
            // Tomamos los lotes de a uno y de forma atómica (PENDING -> PROCESSING)
            // para que un lote cancelado/reprogramado a último momento no se ejecute
            // y ningún lote se procese dos veces.
            let batch;
            while (
                (batch = await Batch.findOneAndUpdate(
                    { status: "PENDING", scheduledAt: { $lte: new Date() } },
                    { status: "PROCESSING" },
                    { new: true, sort: { scheduledAt: 1 } },
                ))
            ) {
                console.log(`🚀 Starting batch #${batch._id} (${batch.processType})`);
                try {
                    await processBatch(batch);
                } catch (err) {
                    console.error(`Batch #${batch._id} failed:`, err);
                    await Batch.updateOne({ _id: batch._id }, { status: "COMPLETED" });
                }
            }
        } catch (err) {
            console.error("Scheduler error:", err);
        } finally {
            running = false;
        }
    });

    console.log("✅ Scheduler Service Started (Polling every 5 mins)");
};
