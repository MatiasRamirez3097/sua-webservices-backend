// Política de contraseñas: se aplica al CREAR, BLANQUEAR o CAMBIAR una contraseña.
// En el login NO se valida el formato (solo se compara contra el hash) para no
// dar pistas sobre la política ni sobre qué dato es incorrecto.
// Mantener sincronizado con: sua-webservices/src/utils/passwordPolicy.js

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_SPECIAL_CHARS = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?~`";

const RULES = [
    {
        test: (p) => p.length >= PASSWORD_MIN_LENGTH,
        message: `al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    },
    {
        test: (p) => p.length <= PASSWORD_MAX_LENGTH,
        message: `como máximo ${PASSWORD_MAX_LENGTH} caracteres`,
    },
    { test: (p) => /[a-z]/.test(p), message: "una letra minúscula" },
    { test: (p) => /[A-Z]/.test(p), message: "una letra mayúscula" },
    { test: (p) => /\d/.test(p), message: "un número" },
    {
        test: (p) => [...p].some((c) => PASSWORD_SPECIAL_CHARS.includes(c)),
        message: "un carácter especial",
    },
    { test: (p) => !/\s/.test(p), message: "sin espacios" },
];

/**
 * @param {string} password
 * @returns {string|null} mensaje de error o null si la contraseña es válida
 */
export const validatePassword = (password) => {
    if (typeof password !== "string" || password.length === 0) {
        return "La contraseña es obligatoria.";
    }
    const failed = RULES.filter((r) => !r.test(password)).map((r) => r.message);
    if (failed.length === 0) return null;
    return `La contraseña debe tener: ${failed.join(", ")}.`;
};
