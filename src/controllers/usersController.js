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
            el = await User.findById(id).exec();
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
            els = await User.find(search);
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
            el = await User.findOneAndUpdate({ _id: id }, req.body);
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
    deleteOne: async (req, res, next) => {
        const id = req.params.id;
        let success = true;
        let el = null;
        let error = null;

        try {
            el = await User.findByIdAndDelete(id).exec();
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
};

export default usersController;
