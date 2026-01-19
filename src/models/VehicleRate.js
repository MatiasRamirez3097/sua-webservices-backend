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

const VehicleRateSchema = new Schema(
    {
        vehicleType: {
            type: String,
            enum: VEHICLE_TYPES,
            required: true,
        },
        hourlyRate: {
            type: Number,
            required: true,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        decreeNumber: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

VehicleRateSchema.index({ vehicleType: 1, validFrom: -1 });

VehicleRateSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});

export default model("VehicleRate", VehicleRateSchema);
