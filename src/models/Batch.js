import { Schema, model } from "mongoose";
import mongooseDelete from "mongoose-delete";

const BatchSchema = new Schema(
    {
        // 1. Process Definition
        processType: {
            type: String,
            required: true,
            // Opcional: Pasarlos a inglés si el frontend también cambia
            // RESOLUTION, INTERVENTION, ASSIGNMENT
            enum: ["RESOLUCION", "DERIVACION", "INTERVENCION", "ASIGNACION"],
        },

        // Área que resuelve (RESOLUCION). En DERIVACION el área destino
        // va en extraData.idAreaDerivada.
        idArea: {
            type: Number,
            required: function () {
                return this.processType === "RESOLUCION";
            },
        },
        // 2. Metadata
        // Fecha de resolución "DD/MM/YYYY HH:MM:SS" (la API de derivar no usa fecha)
        date: {
            type: String,
            required: function () {
                return this.processType === "RESOLUCION";
            },
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User", // Asegúrate que tu modelo de usuario se exporte como "users"
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
            enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELED"],
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
