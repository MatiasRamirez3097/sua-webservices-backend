const validator = (schema) => (req, res, next) => {
    const validation = schema.validate(req.body, { aborEarly: true });

    if (validation.error) {
        console.log(validation);
        return;
    }
    return next();
};

export default validator;
