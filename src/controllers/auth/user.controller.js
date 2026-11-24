import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../../utils/token.util.js";
import { validatePassword } from "../../utils/password.util.js";
import { startsWith } from "../../utils/regex.util.js";

// Campos que se pueden escribir desde la API (evita asignación masiva de
// cualquier otro campo, p. ej. passwordChangedAt o deleted)
const WRITABLE_FIELDS = [
    "name",
    "surname",
    "email",
    "password",
    "isAdmin",
    "suaRole",
    "rodadosRole",
    "area",
];

const pickUserFields = (body = {}) => {
    const data = {};
    for (const f of WRITABLE_FIELDS) if (body[f] !== undefined) data[f] = body[f];
    for (const f of ["suaRole", "rodadosRole", "area"]) if (data[f] === "") data[f] = null;
    if (data.isAdmin !== undefined) data.isAdmin = data.isAdmin === true;
    if (typeof data.email === "string") data.email = data.email.trim();
    return data;
};

/** Un solicitante de rodados solo ve lo de su área: el área es obligatoria. */
const rolesError = ({ rodadosRole, area }) =>
    rodadosRole === "solicitante" && !area
        ? "Para ser solicitante de Rodados el usuario tiene que tener un área."
        : null;

const friendlyDbError = (err) => {
    if (err?.code === 11000) return "Ya existe un usuario con ese email.";
    if (err?.name === "ValidationError")
        return Object.values(err.errors)
            .map((e) => e.message)
            .join(" ");
    if (err?.name === "CastError") return "Identificador inválido.";
    return "No se pudo procesar la solicitud.";
};

const userController = {
    createOne: async (req, res) => {
        const data = pickUserFields(req.body);

        const roleError = rolesError(data);
        if (roleError)
            return res.status(400).json({ response: null, success: false, error: roleError });

        const passwordError = validatePassword(data.password);
        if (passwordError) {
            return res
                .status(400)
                .json({ response: null, success: false, error: passwordError });
        }
        data.password = bcrypt.hashSync(data.password);

        try {
            const el = await User.create(data);
            res.status(201).json({ response: el, success: true, error: null });
        } catch (err) {
            console.error("Error al crear usuario:", err.message);
            res.status(400).json({
                response: null,
                success: false,
                error: friendlyDbError(err),
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const el = await User.findById(req.params.id);
            if (!el)
                return res.status(404).json({
                    response: null,
                    success: false,
                    error: "Usuario no encontrado",
                });
            res.json({ response: el, success: true, error: null });
        } catch (err) {
            res.status(400).json({
                response: null,
                success: false,
                error: friendlyDbError(err),
            });
        }
    },

    getAll: async (req, res) => {
        const search = req.params.search
            ? { name: startsWith(req.params.search) }
            : {};

        try {
            const els = await User.find(search).sort({ name: 1, surname: 1 });
            res.json({ response: els, success: true, error: null });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                response: [],
                success: false,
                error: "No se pudieron obtener los usuarios",
            });
        }
    },

    updateOne: async (req, res) => {
        const id = req.params.id;
        const data = pickUserFields(req.body);

        // Un admin no puede quitarse a sí mismo el rol de administrador
        if (String(req.user._id) === String(id) && data.isAdmin === false) {
            return res.status(400).json({
                response: null,
                success: false,
                error: "No podés quitarte el rol de administrador.",
            });
        }

        if (data.password !== undefined) {
            const passwordError = validatePassword(data.password);
            if (passwordError) {
                return res.status(400).json({
                    response: null,
                    success: false,
                    error: passwordError,
                });
            }
            data.password = bcrypt.hashSync(data.password);
            // Cierra las sesiones abiertas del usuario blanqueado
            data.passwordChangedAt = new Date();
        }

        try {
            const current = await User.findById(id).lean();
            if (current) {
                const roleError = rolesError({ ...current, ...data });
                if (roleError)
                    return res.status(400).json({ response: null, success: false, error: roleError });
            }
            const el = await User.findOneAndUpdate({ _id: id }, data, {
                new: true,
                runValidators: true,
            });
            if (!el)
                return res.status(404).json({
                    response: null,
                    success: false,
                    error: "Usuario no encontrado",
                });
            res.json({ response: el, success: true, error: null });
        } catch (err) {
            console.error("Error al actualizar usuario:", err.message);
            res.status(400).json({
                response: null,
                success: false,
                error: friendlyDbError(err),
            });
        }
    },

    softDeleteOne: async (req, res) => {
        const { id } = req.params;

        if (String(req.user._id) === String(id)) {
            return res.status(400).json({
                success: false,
                error: "No podés eliminar tu propio usuario.",
            });
        }

        try {
            const user = await User.findById(id);
            if (!user)
                return res
                    .status(404)
                    .json({ success: false, error: "Usuario no encontrado" });

            // Borrado lógico sin revalidar todo el documento (un usuario con
            // datos viejos/incompletos tiene que poder eliminarse igual)
            await User.delete({ _id: user._id });
            return res.status(200).json({
                success: true,
                message: "Usuario eliminado",
                response: user,
            });
        } catch (err) {
            return res
                .status(400)
                .json({ success: false, error: friendlyDbError(err) });
        }
    },

    changePassword: async (req, res) => {
        const { currentPassword, newPassword } = req.body ?? {};

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ success: false, error: passwordError });
        }

        try {
            const user = await User.findById(req.user._id);
            if (!user)
                return res
                    .status(404)
                    .json({ success: false, error: "Usuario no encontrado" });

            const isValid = bcrypt.compareSync(
                String(currentPassword ?? ""),
                user.password,
            );
            if (!isValid)
                return res.status(400).json({
                    success: false,
                    error: "La contraseña actual es incorrecta",
                });

            if (bcrypt.compareSync(newPassword, user.password))
                return res.status(400).json({
                    success: false,
                    error: "La nueva contraseña debe ser distinta de la actual",
                });

            user.password = bcrypt.hashSync(newPassword);
            user.passwordChangedAt = new Date();
            await user.save({ validateBeforeSave: false });

            // El token anterior queda invalidado: devolvemos uno nuevo para
            // que la sesión actual siga activa (las demás se cierran).
            res.json({
                success: true,
                message: "Contraseña actualizada correctamente",
                token: signToken(user),
            });
        } catch (err) {
            console.error("Error en changePassword:", err.message);
            res.status(500).json({
                success: false,
                error: "No se pudo cambiar la contraseña",
            });
        }
    },
};

export default userController;
