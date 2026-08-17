// ============================================================
// IMPORT EXPRESS
// ============================================================

const express =
    require("express");


// ============================================================
// CREATE ROUTER
// ============================================================

const router =
    express.Router();


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {

    registerUser,

    verifyEmail,

    loginUser,

    forgotPassword,

    verifyPasswordResetOtp,

    resetPassword

} =
    require("../controllers/authController");


// ============================================================
// VALIDATION
// ============================================================

const validate =
    require("../validators/validationMiddleware");

const {
    registerSchema,
    loginSchema
} =
    require("../validators/authValidator");


// ============================================================
// REGISTER
// ============================================================

router.post(

    "/register",

    validate(registerSchema),

    registerUser

);


// ============================================================
// VERIFY EMAIL
// ============================================================

router.post(

    "/verify-email",

    verifyEmail

);


// ============================================================
// LOGIN
// ============================================================

router.post(

    "/login",

    validate(loginSchema),

    loginUser

);


// ============================================================
// FORGOT PASSWORD
// ============================================================

router.post(

    "/forgot-password",

    forgotPassword

);


// ============================================================
// VERIFY PASSWORD RESET OTP
// ============================================================

router.post(

    "/verify-password-reset-otp",

    verifyPasswordResetOtp

);


// ============================================================
// RESET PASSWORD
// ============================================================

router.post(

    "/reset-password",

    resetPassword

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
    router;