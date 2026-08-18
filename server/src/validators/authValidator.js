// ============================================================
// AUTH VALIDATION
// ============================================================

const Joi = require("joi");


const emailSchema = Joi.string()
    .trim()
    .lowercase()
    .email()
    .required();


const passwordSchema = Joi.string()
    .min(6)
    .max(100)
    .required();


// ------------------------------------------------------------
// REGISTER VALIDATION
// ------------------------------------------------------------

const registerSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    email: emailSchema,

    password: passwordSchema
});


// ------------------------------------------------------------
// LOGIN VALIDATION
// ------------------------------------------------------------

const loginSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema
});


// ------------------------------------------------------------
// EMAIL VERIFICATION VALIDATION
// ------------------------------------------------------------

const verifyEmailSchema = Joi.object({
    pendingRegistrationId: Joi.string()
        .hex()
        .length(24)
        .required(),

    otp: Joi.string()
        .pattern(/^[0-9]{6}$/)
        .required()
});


// ------------------------------------------------------------
// FORGOT PASSWORD VALIDATION
// ------------------------------------------------------------

const forgotPasswordSchema = Joi.object({
    email: emailSchema
});


const verifyPasswordResetOtpSchema = Joi.object({
    email: emailSchema,

    otp: Joi.string()
        .pattern(/^[0-9]{6}$/)
        .required()
});


const resetPasswordSchema = Joi.object({
    email: emailSchema,

    resetToken: Joi.string()
        .hex()
        .length(64)
        .required(),

    newPassword: passwordSchema
});


module.exports = {
    registerSchema,
    verifyEmailSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyPasswordResetOtpSchema,
    resetPasswordSchema
};
