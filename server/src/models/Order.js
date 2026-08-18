// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// ORDER ITEM SCHEMA
// ============================================================

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

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
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: {
            type: [orderItemSchema],
            required: true
        },

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

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

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

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "processing",
                "paid",
                "failed",
                "refunded"
            ],
            default: "pending"
        },

        paymentMethod: {
            type: String,
            enum: [
                "cod",
                "online"
            ],
            default: "cod"
        },

        // ====================================================
        // RAZORPAY PAYMENT INFORMATION
        // ====================================================

        razorpayOrderId: {
            type: String,
            default: null,
            unique: true,
            sparse: true
        },

        razorpayPaymentId: {
            type: String,
            default: null,
            unique: true,
            sparse: true
        },

        razorpaySignature: {
            type: String,
            default: null
        },

        // Timestamp used while a payment verification request is
        // finalizing stock, cart and order state.
        paymentProcessingAt: {
            type: Date,
            default: null
        },

        razorpayRefundId: {
            type: String,
            default: null,
            unique: true,
            sparse: true
        },

        refundStatus: {
            type: String,
            enum: [
                "none",
                "pending",
                "initiated",
                "processed",
                "failed"
            ],
            default: "none"
        },

        // ====================================================
        // RETURN INFORMATION
        // ====================================================

        returnStatus: {
            type: String,
            enum: [
                "none",
                "requested",
                "approved",
                "rejected",
                "received"
            ],
            default: "none"
        },

        returnReason: {
            type: String,
            default: null
        },

        returnRequestedAt: {
            type: Date,
            default: null
        },

        returnProcessedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


const Order = mongoose.model(
    "Order",
    orderSchema
);


module.exports = Order;
