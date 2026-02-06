import Batch from "../../models/Batch.js";
import BatchItem from "../../models/BatchItem.js";
import { formatDateForApi } from "../../utils/date.util.js";

const batchController = {
    createOne: async (req, res) => {
        /* Body esperado (Frontend):
       {
          "type": "RESOLUCION", 
          "date": "2025-11-28T10:00",
          "data": { "leyenda": "Texto...", "tipoResolucion": 1 },
          "records": [ {"sua":"123", "anio":"2024"}, ... ] // Antes 'expedientes'
       }
    */
        const { type, date, data, idArea, records, scheduledFor } = req.body;

        // 1. Validation
        if (!records || records.length === 0) {
            return res.status(400).json({ error: "No records to process" });
        }

        if (type === "RESOLUCION") {
            if (![0, 1, 2].includes(Number(data.tipoResolucion))) {
                return res
                    .status(400)
                    .json({ error: "Invalid resolution type (0, 1, 2)" });
            }
        }

        try {
            // 2. Create Parent (Batch)
            const newBatch = await Batch.create({
                processType: type,
                idArea: idArea,
                date: formatDateForApi(date), // "DD/MM/YYYY HH:MM:SS"
                user: req.user._id, // User ID from Token
                extraData: data,
                totalRecords: records.length,
                status: "PENDING",
                scheduledAt: scheduledFor ? new Date(scheduledFor) : new Date(),
            });

            // 3. Prepare Children (BatchItems)
            // Mapeamos los datos del frontend a nuestro esquema en inglés
            const items = records.map((rec) => ({
                batch: newBatch._id,
                sua: rec.sua,
                year: rec.anio, // El frontend manda 'anio', guardamos en 'year'
                status: "PENDING",
            }));

            // 4. Bulk Insert
            await BatchItem.insertMany(items);

            res.status(200).json({
                success: true,
                message:
                    "Batch created successfully. Scheduled for nightly processing.",
                batchId: newBatch._id,
            });
        } catch (error) {
            console.error("Error creating batch:", error);
            res.status(500).json({
                error: "Internal Server Error creating batch",
            });
        }
    },
    deleteOne: async (req, res, next) => {
        const { id } = req.params;

        try {
            const batch = await Batch.findById(id);
            if (!batch) throw new Error("Lote no encontrado");

            if (batch.status === "PROCESSING") {
                throw new Error(
                    "No se puede eliminar un lote que se esta ejecutando."
                );
            }

            if (batch.totalRecords !== batch.errorsCount) {
                throw new Error(
                    "No se puede eliminar un lote con resultados correctos."
                );
            }

            await batch.delete();

            await BatchItem.delete({ batch: id });

            res.json({ success: true, message: "Lote eliminado con exito." });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    getAll: async (req, res, next) => {
        const search = req.params.search
            ? {
                  name: {
                      $regex: "^" + req.params.search + ".*",
                      $options: "i",
                  },
              }
            : {};
        let success = true;
        let els;
        let error = null;

        try {
            els = await Batch.find(search)
                .sort({ createdAt: -1 })
                .populate("user");
        } catch (err) {
            success = false;
            error = err;
            console.log(err);
        }
        res.json({
            response: els,
            success,
            error,
        });
    },
    getOne: async (req, res, next) => {
        const id = req.params.id;
        const { onlyErrors, itemsFields, fields } = req.query;
        console.log("campos", fields);

        let fieldsToSelect = fields ? fields.split(",").join(" ") : "";
        let itemsFieldsToSelect = itemsFields
            ? itemsFields.split(",").join(" ")
            : "";
        let matchCriteria = {};
        let success = true;
        let el;
        let error = null;
        if (onlyErrors == "true") matchCriteria.status = "ERROR";

        try {
            el = await Batch.findById(id).select(fieldsToSelect).populate({
                path: "items",
                match: matchCriteria,
                select: itemsFieldsToSelect,
            });
        } catch (err) {
            success = false;
            error = err;
        }

        res.json({
            response: el,
            success,
            error,
        });
    },
    reschedule: async (req, res) => {
        const { id } = req.params;
        const { newDate } = req.body;
        try {
            const batch = await Batch.findById(id);
            if (!batch) throw new Error("Lote no encontrado");
            if (batch.status !== "PENDING")
                throw new Error(
                    "No se puede reprogramar un lote que ya se ejecuto o que esta en ejecucion."
                );
            if (batch.scheduledFor) {
                const now = new Date();
                const scheduledTime = new Date(batch.scheduledFor);
                const difference = scheduledTime - now;

                const ONE_HOUR = 60 * 60 * 1000;

                if (difference > 0 && difference < ONE_HOUR) {
                    throw new Error(
                        "Bloqueado: La hora de ejecucion ya paso o falta menos de una hora."
                    );
                }

                if (difference <= 0)
                    throw newError(
                        "BLoqueado: La hora de ejecucion ya paso o falta menos de una hora."
                    );
            }
            batch.scheduledAt = newDate;
            await batch.save();

            res.json({ success: true, response: batch });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
};

export default batchController;
