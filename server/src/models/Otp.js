const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        // User this OTP belongs to
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Purpose of the OTP
        // We will use this later for login as well
        purpose: {
            type: String,
            enum: ["email_verification", "login"],
            required: true
        },

        // Hashed OTP
        otpHash: {
            type: String,
            required: true
        },

        // OTP expiry time
        expiresAt: {
            type: Date,
            required: true
        },

        // Number of incorrect attempts
        attempts: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);


// Automatically delete expired OTP documents
otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


module.exports = mongoose.model("Otp", otpSchema);