import User from "../models/User.js";

const usersController = {
    createOne: async (req, res, next) => {
        let el;
        let success = true;
        let error = null;

        try {
            el = await User.create(req.body);
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
                isDeleted: false,
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
        let el;
        let success = true;
        let error = null;

        try {
            el = await User.findOneAndUpdate(
                { _id: id, isDeleted: false },
                req.body,
                { new: true }
            );
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
    softDeleteOne: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findByIdAndUpdate(
                id,
                { isDeleted: true, deletedAt: new Date() },
                { new: true }
            );

            if (!user)
                return res
                    .status(404)
                    .json({ message: "Usuario no encontrado" });

            return res.status(200).json({
                message: "Usuario marcado como eliminado",
                response: user,
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
};

export default usersController;
