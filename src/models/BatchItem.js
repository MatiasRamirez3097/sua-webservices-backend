import { Schema, model } from "mongoose";

const BatchItemSchema = Schema(
    {
        // 1. Vinculación con el Padre (Parent Link)
        batch: {
            type: Schema.Types.ObjectId,
            ref: "Batch", // <--- Debe coincidir EXACTAMENTE con el export del padre
            required: true,
        },

        // 2. Identificación del Expediente (Record ID)
        sua: { type: String, required: true }, // "sua" es sigla, se queda igual
        year: { type: String, required: true }, // anio -> year

        // 3. Datos Específicos (Optional)
        // Por si un item necesita algo que no está en el batch
        specificData: { type: Object },

        // 4. Estado Individual (Status)
        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "ERROR"], // Inglés
            default: "PENDING",
        },

        // 5. Auditoría y Logs (Audit)
        apiResponse: { type: Object }, // respuestaApi
        errorDetail: { type: String }, // errorDetalle
        processedAt: { type: Date }, // fechaProcesado -> processedAt (convención estándar)
    },
    { timestamps: true }
);

// Índices para búsqueda rápida
// Ayuda al Cron Job a encontrar los "PENDING" rápido
BatchItemSchema.index({ status: 1 });
// Ayuda a buscar "todos los items de este lote"
BatchItemSchema.index({ batch: 1 });

export default model("BatchItem", BatchItemSchema);
