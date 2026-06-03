const { z } = require('zod');
const Validation = require('./index');

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

const loginValidation = (req, res, next) => {
    const schema = z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Invalid password")
    });

    const valid = Validation(schema, req.body);
    if (valid.isValid) {
        req.body = valid.data;
        next();
    } else {
        return res.status(400).json(valid.error);
    }
};

const registerValidation = (req, res, next) => {
    const schema = z.object({
        fullName: z.string().min(3).max(50),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Invalid password"),
        confirm_password: z.string().min(6, "Invalid password"),
        role: z.enum(["user", "admin"]).optional(),
    }).refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

    const valid = Validation(schema, req.body);
    if (valid.isValid) {
        req.body = valid.data;
        next();
    } else {
        return res.status(400).json(valid.error);
    }
};

const userCreateValidation = (req, res, next) => {
    const schema = z.object({
        fullName: z.string().min(3).max(50),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Invalid password"),
        confirm_password: z.string().min(6, "Invalid password"),
        role: z.enum(["user", "admin"]).optional(),
    }).refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

    const valid = Validation(schema, req.body);
    if (valid.isValid) {
        req.body = valid.data;
        next();
    } else {
        return res.status(400).json(valid.error);
    }
};

const userUpdateValidation = (req, res, next) => {
    const schema = z.object({
        fullName: z.string().min(3).max(50).optional(),
        email: z.string().email("Invalid email").optional(),
        password: z.string().min(6, "Invalid password").optional(),
        role: z.enum(["user", "admin"]).optional(),
    });

    const valid = Validation(schema, req.body);
    if (valid.isValid) {
        req.body = valid.data;
        next();
    } else {
        return res.status(400).json(valid.error);
    }
};

const userIdParamValidation = (req, res, next) => {
    const schema = z.object({
        id: objectIdSchema,
    });

    const valid = Validation(schema, req.params);
    if (valid.isValid) {
        req.params = valid.data;
        next();
    } else {
        return res.status(400).json(valid.error);
    }
};

module.exports = {
    loginValidation,
    registerValidation,
    userCreateValidation,
    userUpdateValidation,
    userIdParamValidation,
};