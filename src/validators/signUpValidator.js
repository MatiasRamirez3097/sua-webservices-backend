import joi from "joi";

// La complejidad de la contraseña se valida con la política única de
// utils/password.util.js (ver auth.controller signUp).
export const signUpSchema = joi.object({
    email: joi.string().email().required(),
    name: joi.string().required().min(2).max(40),
    password: joi.string().required(),
    surname: joi.string().required().min(2).max(40),
    verified: joi.boolean(),
});
