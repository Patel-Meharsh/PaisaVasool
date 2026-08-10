// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// ORDER ITEM SCHEMA
// ============================================================

const orderItemSchema = new mongoose.Schema(
    {
        // Product reference
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // Product name at the time of purchase
        // We store this because the product name might change later.
        name: {
            type: String,
            required: true
        },

        // Price at the time of purchase
        // This is important because product price may change later.
        price: {
            type: Number,
            required: true,
            min: 0
        },

        // Quantity purchased
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },

    {
        _id: false
    }
);


// ============================================================
// ORDER SCHEMA
// ============================================================

const orderSchema = new mongoose.Schema(
    {

        // ----------------------------------------------------
        // User who placed the order
        // ----------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // ----------------------------------------------------
        // Products purchased
        // ----------------------------------------------------

        items: {
            type: [orderItemSchema],
            required: true
        },


        // ----------------------------------------------------
        // Shipping address
        // ----------------------------------------------------

        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            postalCode: {
                type: String,
                required: true
            },

            country: {
                type: String,
                required: true,
                default: "India"
            }
        },


        // ----------------------------------------------------
        // Order total
        // ----------------------------------------------------

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },


        // ----------------------------------------------------
        // Order status
        // ----------------------------------------------------

        status: {
            type: String,

            enum: [
                "pending",
                "confirmed",
                "shipped",
                "delivered",
                "cancelled"
            ],

            default: "pending"
        },


        // ----------------------------------------------------
        // Payment status
        // ----------------------------------------------------

        paymentStatus: {
            type: String,

            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ],

            default: "pending"
        },


        // ----------------------------------------------------
        // Payment method
        // ----------------------------------------------------

        paymentMethod: {
            type: String,

            enum: [
                "cod",
                "online"
            ],

            default: "cod"
        }

    },

    {
        timestamps: true
    }
);


// ============================================================
// CREATE MODEL
// ============================================================

const Order = mongoose.model(
    "Order",
    orderSchema
);


// Export model
module.exports = Order;