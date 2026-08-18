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

        // OTP is stored only as a hash.
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
        // Used to prevent repeated reset-email abuse.
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


// Only one active reset request may exist per email.
passwordResetSchema.index(
    { email: 1 },
    { unique: true }
);


// Expire abandoned reset requests automatically.
passwordResetSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


const PasswordReset = mongoose.model(
    "PasswordReset",
    passwordResetSchema
);


module.exports = PasswordReset;
