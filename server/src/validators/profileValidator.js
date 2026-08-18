const Joi = require("joi");


// ============================================================
// PROFILE UPDATE
// ============================================================

const profileSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    phone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{9}$/)
        .allow("")
        .optional()
});


// ============================================================
// CHANGE PASSWORD
// ============================================================

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .min(6)
        .max(100)
        .required(),

    newPassword: Joi.string()
        .min(6)
        .max(100)
        .required(),

    confirmPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
            "any.only": "New passwords do not match"
        })
});


module.exports = {
    profileSchema,
    changePasswordSchema
};
