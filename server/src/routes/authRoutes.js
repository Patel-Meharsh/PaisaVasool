// ============================================================
// IMPORT EXPRESS
// ============================================================

const express = require("express");
const router = express.Router();


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
} = require("../controllers/authController");


// ============================================================
// VALIDATION
// ============================================================

const validate =
    require("../validators/validationMiddleware");

const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyPasswordResetOtpSchema,
    resetPasswordSchema
} = require("../validators/authValidator");


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
    validate(forgotPasswordSchema),
    forgotPassword
);


// ============================================================
// VERIFY PASSWORD RESET OTP
// ============================================================

router.post(
    "/verify-password-reset-otp",
    validate(verifyPasswordResetOtpSchema),
    verifyPasswordResetOtp
);


// Backward-compatible alias used by older client code.
router.post(
    "/verify-reset-otp",
    validate(verifyPasswordResetOtpSchema),
    verifyPasswordResetOtp
);


// ============================================================
// RESET PASSWORD
// ============================================================

router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    resetPassword
);


module.exports = router;
