import { model, Schema } from "mongoose";

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

const User = model("users", userSchema);

export default User;
