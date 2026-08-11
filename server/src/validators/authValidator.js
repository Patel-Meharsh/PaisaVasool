// ============================================================
// AUTH VALIDATION
// ============================================================

const Joi = require("joi");


// ------------------------------------------------------------
// REGISTER VALIDATION
// ------------------------------------------------------------

const registerSchema = Joi.object({

    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: Joi.string()
        .min(6)
        .max(100)
        .required()

});


// ------------------------------------------------------------
// LOGIN VALIDATION
// ------------------------------------------------------------

const loginSchema = Joi.object({

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: Joi.string()
        .min(6)
        .max(100)
        .required()

});


module.exports = {
    registerSchema,
    loginSchema
};