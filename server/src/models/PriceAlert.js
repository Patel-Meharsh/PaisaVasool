// Import mongoose
const mongoose = require("mongoose");

// ============================================================
// PRICE ALERT SCHEMA
// ============================================================

const priceAlertSchema = new mongoose.Schema(
    {
        // ----------------------------------------------------
        // User who wants the price alert
        // ----------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ----------------------------------------------------
        // Product being watched
        // ----------------------------------------------------

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // ----------------------------------------------------
        // Price at which the user wants to be notified
        // ----------------------------------------------------

        targetPrice: {
            type: Number,
            required: true,
            min: 0
        },

        // ----------------------------------------------------
        // Current product price when alert was created
        // ----------------------------------------------------

        currentPrice: {
            type: Number,
            required: true,
            min: 0
        },

        // ----------------------------------------------------
        // Indicates whether the alert has already been sent
        // ----------------------------------------------------

        isNotified: {
            type: Boolean,
            default: false
        },

        // ----------------------------------------------------
        // Date when notification was sent
        // ----------------------------------------------------

        notifiedAt: {
            type: Date,
            default: null
        }
    },

    {
        timestamps: true
    }
);


// ============================================================
// PREVENT DUPLICATE ACTIVE ALERTS
// ============================================================

// A user should not have multiple active alerts
// for the same product.

priceAlertSchema.index(
    {
        user: 1,
        product: 1,
        isNotified: 1
    }
);


// ============================================================
// CREATE MODEL
// ============================================================

const PriceAlert = mongoose.model(
    "PriceAlert",
    priceAlertSchema
);


// ============================================================
// EXPORT MODEL
// ============================================================

module.exports = PriceAlert;