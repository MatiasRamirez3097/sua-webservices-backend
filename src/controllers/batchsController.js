import Batch from "../models/Batch.js";
import BatchItem from "../models/BatchItem.js";
import { formatDateForApi } from "../utils/dateFormatter.js";

const batchsController = {
    createOne: async (req, res) => {
        /* Body esperado (Frontend):
       {
          "type": "RESOLUCION", 
          "date": "2025-11-28T10:00",
          "data": { "leyenda": "Texto...", "tipoResolucion": 1 },
          "records": [ {"sua":"123", "anio":"2024"}, ... ] // Antes 'expedientes'
       }
    */
        console.log(req.body);
        const { type, date, data, records, scheduledFor } = req.body;

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
            els = await Batch.find(search).populate("user");
        } catch (err) {
            success = false;
            error = err;
        }
        res.json({
            response: els,
            success,
            error,
        });
    },
    getOne: async (req, res, next) => {
        const id = req.params.id;
        const { onlyErrors } = req.params;
        let matchCriteria = {};
        let success = true;
        let el;
        let error = null;

        if (onlyErrors === "true") matchCriteria.status = "ERROR";

        try {
            el = await Batch.findById(id).populate({
                path: "items",
                match: matchCriteria,
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
};

export default batchsController;
