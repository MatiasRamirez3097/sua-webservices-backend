import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config.js";

const authController = {
    signIn: async (req, res, next) => {
        console.log(req.body);
        try {
            const { email: emailBody, password } = req.body;
            const user = await User.findOne({ email: emailBody });
            if (!user) throw new Error("No user exists with this email");
            const passValidated = bcrypt.compareSync(password, user.password);
            if (!passValidated)
                throw new Error("The email/password is incorrect");

            const { email, name, role } = user;

            const token = jwt.sign({ email }, process.env.SECRET_KEY);

            return res.status(200).json({
                success: true,
                token: token,
                user: { email, name, role },
                message: "Sign in succesfully",
            });
        } catch (err) {
            return res.status(400).json({
                response: err.name,
                success: false,
                error: err.message,
                code: "NO_USER_EXISTS",
            });
        }
    },
    signUp: async (req, res, next) => {
        let user;
        let token;

        try {
            const hashPassword = bcrypt.hashSync(req.body.password);
            req.body.password = hashPassword;
            user = await User.create(req.body);

            const { email, name } = user;
            token = jwt.sign({ email }, process.env.SECRET_KEY);
            return res.status(200).json({
                success: true,
                token: token,
                user: { email, name },
                message: "Sign in succesfully",
            });
        } catch (err) {
            return res.status(400).json({
                response: err.name,
                success: false,
                error: err.message,
                code: "USER_EXISTS",
            });
        }
    },
    loginWithToken: (req, res) => {
        const { email, name, role } = req.user;

        res.json({
            success: true,
            user: { email, name, role },
            message: "Sign in successfully",
        });
    },
};

export default authController;
