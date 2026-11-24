import Batch from "../../models/Batch.js";
import BatchItem from "../../models/BatchItem.js";
import { formatDateForApi } from "../../utils/date.util.js";
import { can, PERMISSIONS } from "../../utils/roles.js";

/** Si el usuario solo puede gestionar sus propios lotes, filtra por autor. */
const ownerFilter = (user) =>
    can(user, PERMISSIONS.LOTES_GESTIONAR_TODOS) ? {} : { user: user._id };

const NOT_OWNER = "Solo podés modificar los lotes que cargaste vos.";

const MAX_RECORDS = 5000;
const SUPPORTED_TYPES = ["RESOLUCION", "DERIVACION"];

// Campos que el front puede pedir en getOne (evita exponer datos internos)
const BATCH_FIELDS = new Set([
    "date",
    "processType",
    "idArea",
    "extraData",
    "totalRecords",
    "processed",
    "errorsCount",
    "scheduledAt",
    "status",
    "createdAt",
]);
const ITEM_FIELDS = new Set([
    "requestId",
    "sua",
    "year",
    "status",
    "errorDetail",
    "processedAt",
]);

const pickFields = (raw, allowed) =>
    String(raw || "")
        .split(",")
        .map((f) => f.trim())
        .filter((f) => allowed.has(f))
        .join(" ");

const isPositiveIntString = (v) => /^\d+$/.test(v) && Number(v) > 0;

/**
 * Normaliza los registros del CSV: cada uno debe traer el id de la solicitud.
 * Devuelve { ids, invalid } con los ids únicos y las filas inválidas.
 */
const normalizeRecords = (records) => {
    const ids = [];
    const seen = new Set();
    const invalid = [];

    records.forEach((rec, index) => {
        const raw = rec?.id ?? rec?.requestId ?? rec?.idSolicitud;
        const id = String(raw ?? "").trim();
        if (!isPositiveIntString(id)) {
            invalid.push({ fila: index + 1, valor: raw ?? "" });
            return;
        }
        if (seen.has(id)) return; // duplicado: se procesa una sola vez
        seen.add(id);
        ids.push(id);
    });

    return { ids, invalid };
};

const batchController = {
    /*
     * Body esperado:
     * {
     *   "type": "RESOLUCION" | "DERIVACION",
     *   "date": "2025-11-28T10:00",          // solo RESOLUCION
     *   "idArea": 2098,                      // solo RESOLUCION
     *   "scheduledFor": "2025-11-28T22:00",
     *   "data": { "legend": "Texto...", "idAreaDerivada": 2115 },  // idAreaDerivada solo DERIVACION
     *   "records": [ { "id": "123456" }, ... ]
     * }
     */
    createOne: async (req, res) => {
        const { type, date, data = {}, idArea, records, scheduledFor } =
            req.body ?? {};

        if (!SUPPORTED_TYPES.includes(type)) {
            return res
                .status(400)
                .json({ success: false, error: "Tipo de proceso no soportado" });
        }

        if (!Array.isArray(records) || records.length === 0) {
            return res
                .status(400)
                .json({ success: false, error: "No hay registros para procesar" });
        }
        if (records.length > MAX_RECORDS) {
            return res.status(400).json({
                success: false,
                error: `Máximo ${MAX_RECORDS} registros por lote`,
            });
        }

        const legend = String(data.legend ?? "").trim();
        if (!legend) {
            return res
                .status(400)
                .json({ success: false, error: "La solución (leyenda) es obligatoria" });
        }

        const extraData = { legend };
        let batchIdArea;
        let batchDate;

        if (type === "RESOLUCION") {
            if (!Number.isInteger(Number(idArea)) || Number(idArea) <= 0) {
                return res
                    .status(400)
                    .json({ success: false, error: "El área es inválida" });
            }
            if (!date) {
                return res.status(400).json({
                    success: false,
                    error: "La fecha de resolución es obligatoria",
                });
            }
            batchIdArea = Number(idArea);
            batchDate = formatDateForApi(date); // "DD/MM/YYYY HH:MM:SS"
        } else {
            const destino = Number(data.idAreaDerivada);
            if (!Number.isInteger(destino) || destino <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "El área de destino es inválida",
                });
            }
            extraData.idAreaDerivada = destino;
        }

        const scheduledAt = scheduledFor ? new Date(scheduledFor) : new Date();
        if (Number.isNaN(scheduledAt.getTime())) {
            return res
                .status(400)
                .json({ success: false, error: "Fecha de ejecución inválida" });
        }

        const { ids, invalid } = normalizeRecords(records);
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Hay ${invalid.length} registro(s) sin un id de solicitud válido (filas: ${invalid
                    .slice(0, 10)
                    .map((i) => i.fila)
                    .join(", ")}${invalid.length > 10 ? "…" : ""})`,
                invalid,
            });
        }

        try {
            const newBatch = await Batch.create({
                processType: type,
                idArea: batchIdArea,
                date: batchDate,
                user: req.user._id,
                extraData,
                totalRecords: ids.length,
                status: "PENDING",
                scheduledAt,
            });

            await BatchItem.insertMany(
                ids.map((requestId) => ({
                    batch: newBatch._id,
                    requestId,
                    status: "PENDING",
                })),
            );

            res.status(200).json({
                success: true,
                message: "Lote creado y agendado correctamente.",
                batchId: newBatch._id,
                totalRecords: ids.length,
                duplicatesRemoved: records.length - ids.length,
            });
        } catch (error) {
            console.error("Error creating batch:", error);
            res.status(500).json({
                success: false,
                error: "Error interno al crear el lote",
            });
        }
    },

    cancel: async (req, res) => {
        try {
            // Atómico: solo se cancela si sigue PENDING (evita carrera con el cron)
            const own = ownerFilter(req.user);
            const batch = await Batch.findOneAndUpdate(
                { _id: req.params.id, status: "PENDING", ...own },
                { status: "CANCELED" },
                { new: true },
            ).populate("user", "name surname email");

            if (!batch && own.user && (await Batch.exists({ _id: req.params.id, user: { $ne: own.user } }))) {
                return res.status(403).json({ success: false, error: NOT_OWNER });
            }
            if (!batch) {
                return res.status(400).json({
                    success: false,
                    error: "Solo se pueden cancelar lotes pendientes.",
                });
            }
            res.json({ success: true, response: batch });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    deleteOne: async (req, res) => {
        const { id } = req.params;

        try {
            const batch = await Batch.findById(id);
            if (!batch) throw new Error("Lote no encontrado");

            const deletable =
                batch.status === "CANCELED" ||
                (batch.status === "COMPLETED" &&
                    batch.totalRecords === batch.errorsCount);

            if (!deletable) {
                throw new Error(
                    batch.status === "COMPLETED"
                        ? "No se puede eliminar un lote con resultados correctos."
                        : "Solo se pueden eliminar lotes cancelados o completados sin éxitos.",
                );
            }

            await batch.delete();
            await BatchItem.delete({ batch: id });

            res.json({ success: true, message: "Lote eliminado con éxito." });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const els = await Batch.find({})
                .sort({ createdAt: -1 })
                .populate("user", "name surname email");
            res.json({ response: els, success: true, error: null });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                response: [],
                success: false,
                error: "No se pudieron obtener los lotes",
            });
        }
    },

    getOne: async (req, res) => {
        const { onlyErrors, itemsFields, fields } = req.query;

        const matchCriteria = onlyErrors === "true" ? { status: "ERROR" } : {};
        const batchFields = pickFields(fields, BATCH_FIELDS);
        const itemFields = pickFields(itemsFields, ITEM_FIELDS);

        try {
            const el = await Batch.findById(req.params.id)
                .select(batchFields ? `${batchFields} processType` : "")
                .populate({
                    path: "items",
                    match: matchCriteria,
                    select: itemFields || "-apiResponse",
                });
            if (!el)
                return res
                    .status(404)
                    .json({ response: null, success: false, error: "Lote no encontrado" });
            res.json({ response: el, success: true, error: null });
        } catch (err) {
            res.status(500).json({ response: null, success: false, error: err.message });
        }
    },

    reschedule: async (req, res) => {
        const { id } = req.params;
        const newDate = new Date(req.body?.newDate);

        try {
            if (Number.isNaN(newDate.getTime()))
                throw new Error("Fecha inválida.");
            if (newDate.getTime() < Date.now() + 60 * 1000)
                throw new Error("La nueva fecha debe ser futura.");

            const batch = await Batch.findById(id);
            if (!batch) throw new Error("Lote no encontrado");

            const own = ownerFilter(req.user);
            if (own.user && String(batch.user) !== String(own.user))
                return res.status(403).json({ success: false, error: NOT_OWNER });

            if (!["PENDING", "CANCELED"].includes(batch.status))
                throw new Error(
                    "No se puede reprogramar un lote que ya se ejecutó o que está en ejecución.",
                );

            if (batch.status === "PENDING" && batch.scheduledAt) {
                const diff = new Date(batch.scheduledAt).getTime() - Date.now();
                if (diff < 15 * 60 * 1000)
                    throw new Error(
                        "Bloqueado: la ejecución ya pasó o faltan menos de 15 minutos.",
                    );
            }

            // Atómico respecto del estado leído, y reactivamos si estaba cancelado
            const updated = await Batch.findOneAndUpdate(
                { _id: id, status: batch.status },
                { scheduledAt: newDate, status: "PENDING" },
                { new: true },
            ).populate("user", "name surname email");
            if (!updated)
                throw new Error("El lote cambió de estado, actualizá la pantalla.");

            res.json({ success: true, response: updated });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
};

export default batchController;
