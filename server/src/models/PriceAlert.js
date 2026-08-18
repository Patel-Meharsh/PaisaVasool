// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// PRICE ALERT SCHEMA
// ============================================================

const priceAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        targetPrice: {
            type: Number,
            required: true,
            min: 0
        },

        currentPrice: {
            type: Number,
            required: true,
            min: 0
        },

        isNotified: {
            type: Boolean,
            default: false
        },

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
// DATABASE-LEVEL DUPLICATE PROTECTION
// ============================================================

// Application-level findOne checks are not sufficient under
// concurrent requests. This partial unique index guarantees that
// a user can have only one active (not-yet-notified) alert for a
// product, while still allowing a new alert after notification.
priceAlertSchema.index(
    {
        user: 1,
        product: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            isNotified: false
        }
    }
);


const PriceAlert = mongoose.model(
    "PriceAlert",
    priceAlertSchema
);


module.exports = PriceAlert;
