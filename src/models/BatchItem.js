import { Schema, model } from "mongoose";
import mongooseDelete from "mongoose-delete";

const BatchItemSchema = new Schema(
    {
        // 1. Vinculación con el Padre (Parent Link)
        batch: {
            type: Schema.Types.ObjectId,
            ref: "Batch", // <--- Debe coincidir EXACTAMENTE con el export del padre
            required: true,
        },

        // 2. Identificación de la solicitud
        // API SUA v2: cada solicitud se identifica solo por su id numérico.
        requestId: { type: String, trim: true },
        // LEGACY (API v1): número de SUA + año. Se conservan solo para poder
        // mostrar lotes viejos; los lotes nuevos no los usan.
        sua: { type: String },
        year: { type: String },

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

BatchItemSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});
// Índices para búsqueda rápida
// Ayuda al Cron Job a encontrar los "PENDING" rápido
BatchItemSchema.index({ status: 1 });
// Ayuda a buscar "todos los items de este lote"
BatchItemSchema.index({ batch: 1 });

export default model("BatchItem", BatchItemSchema);
