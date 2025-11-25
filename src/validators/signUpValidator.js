import joi from "joi";
import joiPwd from "joi-password-complexity";

const complexityOptions = {
    min: 8,
    max: 30,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    requirementCount: 2,
    symbol: 1,
};

export const signUpSchema = joi.object({
    email: joi.string().email().required(),
    name: joi.string().required().min(3).max(15),
    password: joiPwd(complexityOptions),
    surname: joi.string().required().min(3).max(15),
    verified: joi.boolean(),
});
