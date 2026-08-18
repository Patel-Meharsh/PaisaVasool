// ============================================================
// IMPORT MONGOOSE
// ============================================================

const mongoose = require("mongoose");


// ============================================================
// PASSWORD RESET SCHEMA
// ============================================================

const passwordResetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        otpHash: {
            type: String,
            required: true
        },

        // OTP validity window.
        expiresAt: {
            type: Date,
            required: true
        },

        // Incorrect OTP attempts for this reset request.
        otpAttempts: {
            type: Number,
            default: 0,
            min: 0
        },

        // Time the most recent OTP was generated.
        otpSentAt: {
            type: Date,
            required: true
        },

        otpVerified: {
            type: Boolean,
            default: false
        },

        verifiedAt: {
            type: Date,
            default: null
        },

        resetTokenHash: {
            type: String,
            default: null
        },

        resetTokenExpiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// ============================================================
// INDEXES
// ============================================================

// Only one reset request may exist for an email.
passwordResetSchema.index(
    { email: 1 },
    { unique: true }
);

// Remove abandoned OTP requests automatically.
// During OTP verification the same expiresAt is later extended
// to the reset-token expiry by the findOneAndUpdate hook below.
passwordResetSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


// ============================================================
// RESET-TOKEN EXPIRATION HARDENING
// ============================================================

// The OTP expires after 5 minutes, but the reset token remains valid
// for 10 minutes after OTP verification. Keep the TTL cleanup window
// aligned with the active reset-token window.
passwordResetSchema.pre(
    "findOneAndUpdate",
    function(next) {

        const update = this.getUpdate() || {};
        const set = update.$set || {};

        if (set.resetTokenExpiresAt) {
            set.expiresAt = set.resetTokenExpiresAt;
            update.$set = set;
            this.setUpdate(update);
        }

        next();
    }
);


const PasswordReset = mongoose.model(
    "PasswordReset",
    passwordResetSchema
);


module.exports = PasswordReset;
