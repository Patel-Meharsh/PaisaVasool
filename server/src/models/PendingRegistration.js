// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// PENDING REGISTRATION SCHEMA
// ============================================================
// Stores registration information temporarily until
// the user's email is successfully verified.
// ============================================================

const pendingRegistrationSchema = new mongoose.Schema(

    {

        // ----------------------------------------------------
        // User's name
        // ----------------------------------------------------

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ----------------------------------------------------
        // User's email
        // ----------------------------------------------------

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },


        // ----------------------------------------------------
        // Already hashed password
        // ----------------------------------------------------
        // IMPORTANT:
        // We NEVER store the plain-text password here.
        // ----------------------------------------------------

        passwordHash: {
            type: String,
            required: true
        },


        // ----------------------------------------------------
        // Hashed OTP
        // ----------------------------------------------------

        otpHash: {
            type: String,
            required: true
        },


        // ----------------------------------------------------
        // OTP expiration
        // ----------------------------------------------------

        expiresAt: {
            type: Date,
            required: true
        }

    },

    {

        timestamps: true

    }

);


// ============================================================
// INDEXES
// ============================================================

// Automatically remove expired pending registrations.
//
// This means if the user never verifies their email,
// the temporary registration will eventually disappear
// from MongoDB automatically.

pendingRegistrationSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);


// Prevent multiple pending registrations for the
// same email address.

pendingRegistrationSchema.index(
    {
        email: 1
    },
    {
        unique: true
    }
);


// ============================================================
// CREATE MODEL
// ============================================================

const PendingRegistration =
    mongoose.model(
        "PendingRegistration",
        pendingRegistrationSchema
    );


// ============================================================
// EXPORT MODEL
// ============================================================

module.exports =
    PendingRegistration;