// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// PENDING REGISTRATION SCHEMA
// ============================================================

const pendingRegistrationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        // Password is already bcrypt-hashed before it is stored here.
        passwordHash: {
            type: String,
            required: true
        },

        // OTP is stored only as a hash.
        otpHash: {
            type: String,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        // Number of incorrect OTP attempts for this registration.
        otpAttempts: {
            type: Number,
            default: 0,
            min: 0
        },

        // Used to enforce a resend/request cooldown.
        otpSentAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);


// Automatically remove expired registrations.
pendingRegistrationSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


// Only one pending registration may exist for an email.
pendingRegistrationSchema.index(
    { email: 1 },
    { unique: true }
);


const PendingRegistration = mongoose.model(
    "PendingRegistration",
    pendingRegistrationSchema
);


module.exports = PendingRegistration;
