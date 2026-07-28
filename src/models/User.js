import { model, Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";

const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        surname: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "fiscalizado"],
            default: null,
        },
        area: {
            type: String,
            enum: [
                "Arbolado",
                "Espacios Verdes",
                "Control de Vectores",
                "Escuela de jardineria",
                "Vivero",
                "Taller",
                "Despacho",
                "Paisajismo",
                "Inspeccion",
                "Centralizacion",
                "Procesamiento de datos",
                "Departamento Tecnico",
                "Centro de Informatica",
                "Direccion administrativa",
                "Direccion General",
                "Subdireccion General",
                null,
            ],
            default: null,
        },
        permissions: {
            type: [
                {
                    module: {
                        type: String,
                        enum: ["rodados", "estadocargas", "gestionsua"],
                        required: true,
                    },
                    role: {
                        type: String,
                        enum: ["manager", "operator", "viewer"],
                        required: true,
                    },
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

UserSchema.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: "all", // Sobrescribe find, findOne, count, etc.
});

const User = model("User", UserSchema);

export default User;
