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
        // Se usa para invalidar los tokens emitidos antes de un cambio/blanqueo
        passwordChangedAt: { type: Date, default: null },
        // Roles (ver src/utils/roles.js)
        isAdmin: { type: Boolean, default: false },
        suaRole: {
            type: String,
            enum: ["consulta", "operador", "supervisor", null],
            default: null,
        },
        rodadosRole: {
            type: String,
            enum: ["solicitante", "encargado", null],
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
    },
    {
        timestamps: true,
        // Nunca devolver el hash de la contraseña en las respuestas JSON
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password;
                delete ret.passwordChangedAt;
                delete ret.__v;
                // Restos del esquema de roles anterior (ver utils/migrateRoles.js)
                delete ret.role;
                delete ret.permissions;
                return ret;
            },
        },
    },
);

UserSchema.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: "all", // Sobrescribe find, findOne, count, etc.
});

const User = model("User", UserSchema);

export default User;
