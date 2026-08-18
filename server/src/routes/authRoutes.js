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
    resetPassword,
    logoutUser
} = require("../controllers/authController");


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

const protect = require("../middleware/authMiddleware");

const validate =
    require("../validators/validationMiddleware");

const {
    registerSchema,
    loginSchema
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
// LOGOUT
// ============================================================

// The frontend also removes the JWT locally, while this endpoint
// invalidates the token server-side by increasing sessionVersion.
router.post(
    "/logout",
    protect,
    logoutUser
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;
