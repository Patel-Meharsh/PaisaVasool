// ============================================================
// IMPORT EXPRESS
// ============================================================

const express = require("express");
const router = express.Router();


// ============================================================
// IMPORT AUTHENTICATION MIDDLEWARE
// ============================================================

const protect =
    require("../middleware/authMiddleware");


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {
    registerUser,
    verifyEmail,
    loginUser,
    forgotPassword,
    verifyPasswordResetOtp,
    resetPassword,
    logoutUser
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


router.post(
    "/register",
    validate(registerSchema),
    registerUser
);


router.post(
    "/verify-email",
    verifyEmail
);


router.post(
    "/login",
    validate(loginSchema),
    loginUser
);


router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    forgotPassword
);


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


router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    resetPassword
);


// ============================================================
// LOGOUT
// ============================================================
// Invalidates the current JWT through sessionVersion.

router.post(
    "/logout",
    protect,
    logoutUser
);


module.exports = router;
