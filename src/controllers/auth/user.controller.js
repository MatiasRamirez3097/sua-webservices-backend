import User from "../../models/User.js";
import bcrypt from "bcryptjs";

const userController = {
    createOne: async (req, res, next) => {
        if (req.body.role === "") req.body.role = null;
        if (req.body.area === "") req.body.area = null;

        const hashPassword = bcrypt.hashSync(req.body.password);
        req.body.password = hashPassword;

        let el;
        let success = true;
        let error = null;

        try {
            el = await User.create(req.body);
        } catch (err) {
            success = false;
            error = err;
            console.log("ERROR AL CREAR:", err.message); // ✅ así ves el error real
        }

        res.json({ response: el, success, error });
    },
    getOne: async (req, res, next) => {
        const id = req.params.id;
        let success = true;
        let el;
        let error = null;

        try {
            el = await User.findOne({ _id: id, isDeleted: false }).exec();
        } catch (err) {
            success = false;
            error = err;
        }
        res.json({
            response: el,
            success,
            error,
        });
    },
    getAll: async (req, res, next) => {
        const search = req.params.search
            ? {
                  name: {
                      $regex: "^" + req.params.search + ".*",
                      $options: "i",
                  },
              }
            : {};

        let success = true;
        let els;
        let error = null;

        try {
            els = await User.find({
                ...search,
            });
        } catch (err) {
            success = false;
            error = err;
        }

        res.json({
            response: els,
            success,
            error,
        });
    },
    updateOne: async (req, res, next) => {
        const id = req.params.id;

        if (req.body.role === "") req.body.role = null;
        if (req.body.area === "") req.body.area = null;

        if (req.body.password) {
            req.body.password = bcrypt.hashSync(req.body.password);
        }

        try {
            const el = await User.findOneAndUpdate({ _id: id }, req.body, {
                new: true,
            });
            res.json({ response: el, success: true, error: null });
        } catch (err) {
            console.log("ERROR AL ACTUALIZAR:", err.message);
            res.json({ response: null, success: false, error: err });
        }
    },
    softDeleteOne: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.deleteById(id);

            if (!user)
                return res
                    .status(404)
                    .json({ message: "Usuario no encontrado" });

            return res.status(200).json({
                message: "Usuario eliminado",
                response: user,
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
};

export default userController;
