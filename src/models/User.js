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
            enum: ["admin", "manager", "operator", "viewer"],
            default: "viewer",
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
                "Departamento Tecnico",
                "Centro de Informatica",
                null,
                ],
                default: null,
            },
            permissions: {
                type: [String],
                enum: ["rodados", "estadocargas", "resoluciones", "usuarios"],
                default: [],  // ✅ sin permisos por defecto
            },
    },
    {
        timestamps: true,
    }
);

UserSchema.plugin(mongooseDelete, {
    deletedAt: true, 
    overrideMethods: "all", // Sobrescribe find, findOne, count, etc.
});

const User = model("User", UserSchema);

export default User;
