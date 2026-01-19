import { Schema, model } from "mongoose";
import mongooseDelete from "mongoose-delete";

const DriverSchema = new Schema({
    nationalId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    taxId: { type: Number, required: true },

    nationality: { type: String, default: "Argentina", required: true },

    email: { type: String },

    realAddress: { type: String, required: true },
    legalAddress: { type: String, required: true },

    active: { type: Boolean, default: true },
});

DriverSchema.virtual("fullName").get(function () {
    return;
});

DriverSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});

export default DriverSchema;
