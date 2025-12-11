import { Schema, model } from "mongoose";
import mongooseDelete from "mongoose-delete";

const BatchSchema = Schema(
    {
        // 1. Process Definition
        processType: {
            type: String,
            required: true,
            // Opcional: Pasarlos a inglés si el frontend también cambia
            // RESOLUTION, INTERVENTION, ASSIGNMENT
            enum: ["RESOLUCION", "INTERVENCION", "ASIGNACION"],
        },

        // 2. Metadata
        date: { type: String, required: true },

        user: {
            type: Schema.Types.ObjectId,
            ref: "users", // Asegúrate que tu modelo de usuario se exporte como "users"
            required: true,
        },

        // 3. Dynamic Payload
        extraData: {
            type: Object,
            required: true,
        },

        // 4. Progress Tracking
        totalRecords: { type: Number, required: true }, // Cambio: registers -> records
        processed: { type: Number, default: 0 },
        errorsCount: { type: Number, default: 0 },

        scheduledAt: {
            type: Date,
            required: true,
            default: Date.now, // Por defecto, "ahora mismo" si no envían nada
        },

        status: {
            // Cambio: state -> status
            type: String,
            enum: ["PENDING", "PROCESSING", "COMPLETED"], // Cambio: Inglés
            default: "PENDING",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

BatchSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});

BatchSchema.virtual("items", {
    ref: "BatchItem",
    localField: "_id",
    foreignField: "batch",
});

export default model("Batch", BatchSchema);
