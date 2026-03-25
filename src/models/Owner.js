import { Schema, model } from "mongoose";
import mongooseDelete from "mongoose-delete";

const OwnerSchema = new Schema(
    {
        name: { type: String, required: true },

        taxId: { type: Number, required: true, unique: true },

        nationality: { type: String, default: "Argentina", required: true },

        email: { type: String },

        realAddress: { type: String, required: true },
        legalAddress: { type: String, required: true },

        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

OwnerSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});

export default model("Owner", OwnerSchema);
