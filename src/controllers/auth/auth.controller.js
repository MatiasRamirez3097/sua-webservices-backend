import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { escapeRegex } from "../../utils/regex.util.js";
import { validatePassword } from "../../utils/password.util.js";
import { publicUser, signToken } from "../../utils/token.util.js";
import {
    clearLoginFailures,
    isLoginBlocked,
    registerLoginFailure,
} from "../../utils/loginLimiter.js";

// Mensaje único para cualquier fallo de credenciales: no revelamos si el
// usuario existe ni si lo incorrecto fue el email o la contraseña.
const GENERIC_ERROR = "Usuario o contraseña incorrectos";

// Hash dummy para que el tiempo de respuesta sea similar exista o no el usuario
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const authController = {
    signIn: async (req, res) => {
        const { email: emailBody, password } = req.body ?? {};
        const ip = req.ip;

        if (isLoginBlocked(ip, emailBody)) {
            return res.status(429).json({
                success: false,
                error: "Demasiados intentos fallidos. Esperá unos minutos e intentá nuevamente.",
                code: "TOO_MANY_ATTEMPTS",
            });
        }

        try {
            if (!emailBody || !password) {
                return res.status(401).json({
                    success: false,
                    error: GENERIC_ERROR,
                    code: "INVALID_CREDENTIALS",
                });
            }

            // Búsqueda exacta pero sin distinguir mayúsculas/minúsculas
            const user = await User.findOne({
                email: {
                    $regex: `^${escapeRegex(String(emailBody).trim())}$`,
                    $options: "i",
                },
            });

            const passValidated = bcrypt.compareSync(
                String(password),
                user?.password || DUMMY_HASH,
            );

            if (!user || !passValidated) {
                registerLoginFailure(ip, emailBody);
                return res.status(401).json({
                    success: false,
                    error: GENERIC_ERROR,
                    code: "INVALID_CREDENTIALS",
                });
            }

            clearLoginFailures(ip, emailBody);

            return res.status(200).json({
                success: true,
                token: signToken(user),
                user: publicUser(user),
                message: "Sign in successfully",
            });
        } catch (err) {
            console.error("Error en signIn:", err);
            return res.status(500).json({
                success: false,
                error: "No se pudo iniciar sesión. Intentá nuevamente.",
                code: "SERVER_ERROR",
            });
        }
    },

    // Alta de usuario (solo admin, ver auth.routes.js)
    signUp: async (req, res) => {
        const passwordError = validatePassword(req.body?.password);
        if (passwordError)
            return res.status(400).json({ success: false, error: passwordError });
        try {
            const { email, name, surname, password } = req.body;
            const user = await User.create({
                email: String(email).trim(),
                name,
                surname,
                password: bcrypt.hashSync(password),
            });
            return res.status(201).json({
                success: true,
                user: publicUser(user),
                message: "Usuario creado",
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error:
                    err?.code === 11000
                        ? "Ya existe un usuario con ese email."
                        : "No se pudo crear el usuario.",
                code: "USER_EXISTS",
            });
        }
    },

    loginWithToken: (req, res) => {
        res.json({
            success: true,
            user: publicUser(req.user),
            message: "Sign in successfully",
        });
    },
};

export default authController;
