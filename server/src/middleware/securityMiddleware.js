// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");


// ============================================================
// HELMET
// Adds common HTTP security headers
// ============================================================

const securityHeaders = helmet();


// ============================================================
// AUTH RATE LIMITER
// Protects login / registration / OTP endpoints
// from excessive requests.
// ============================================================

const authRateLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 20,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many authentication requests. Please try again later."
    }

});


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    securityHeaders,
    authRateLimiter
};