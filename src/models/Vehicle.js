import { Schema, model } from "mongoose";
import mongooseDelete from "mongoose-delete";

const VEHICLE_TYPES = [
    "AUTO",
    "UTILITARIO",
    "MICROÓMNIBUS FURGON",
    "MICROÓMNIBUS FURGON C/ACOPLADO",
    "CAMION VOLCADOR",
    "CAMION REGADOR",
    "PICK UP GRÚAS",
    "PICK UP",
    "PICK UP C/ACOPLADO",
    "PICK UP DOBLE CABINA",
    "PICK UP DOBLE CABINA C/ACOPLADO",
    "CAMION C/SIST. ENG. TIPO RASTRILLO O REMOLQUE",
    "CAMION VOLCADOR C/ASIST. HIDROELEVADOR",
];

const VehicleSchema = new Schema(
    {
        // 1. Process Definition
        plate: { type: String, required: true, unique: true, uppercase: true },
        brand: { type: String, required: true },
        model: { type: String, required: true },
        type: { type: String, enum: VEHICLE_TYPES, required: true },
        year: { type: Number, required: true },

        engineNumber: { type: String, required: true },
        chassisNumber: { type: String, required: true },
        rnpa: { type: String, required: true },
        seccional: { type: String, required: true },

        maxHours: { type: Number, default: 0 },
        contractDuration: { type: Number },
        contractStartDate: { type: Date },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "Owner",
            required: true,
        },
        currentDriver: {
            type: Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },
        status: {
            type: String,
            enum: ["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"],
            default: "AVAILABLE",
        },
    },
    {
        timestamps: true,
    }
);

VehicleSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});

export default model("Vehicle", VehicleSchema);
