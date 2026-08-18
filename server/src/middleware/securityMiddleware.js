// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");


// ============================================================
// HELMET
// ============================================================

const securityHeaders = helmet();


// ============================================================
// GENERAL API RATE LIMITER
// ============================================================
// Protects public API endpoints from excessive automated traffic.
// Authentication routes use a stricter limiter below.

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Too many requests. Please try again later."
    }
});


// ============================================================
// AUTH RATE LIMITER
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


module.exports = {
    securityHeaders,
    apiRateLimiter,
    authRateLimiter
};
