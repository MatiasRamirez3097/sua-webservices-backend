import { model, Schema } from "mongoose";
import mongooseDelete from "mongoose-delete";

const userSchema = Schema(
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
            enum: ["admin", "manager", "reader"],
            default: "reader",
        },
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(mongooseDelete, {
    deletedAt: true, // Guarda la fecha de borrado
    overrideMethods: "all", // ¡CLAVE! Sobrescribe find, findOne, count, etc.
});

const User = model("users", userSchema);

export default User;
