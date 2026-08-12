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
        },
        // ====================================================
        // RAZORPAY PAYMENT INFORMATION
        // ====================================================
        // Razorpay order ID
        // Created when we create a Razorpay payment order.
        razorpayOrderId: {
            type: String,
            default: null
        },
        // Razorpay payment ID
        // Received after the customer completes payment.
        razorpayPaymentId: {
            type: String,
            default: null
        },
        // Razorpay payment signature
        // Used by the backend to verify the payment.
        razorpaySignature: {
            type: String,
            default: null
        },
        // Razorpay refund ID
        // Stored when a refund is created.
        razorpayRefundId: {
            type: String,
            default: null
        },
        // ----------------------------------------------------
        // Refund status
        // ----------------------------------------------------
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
        // Current return status of the order.
        // none      → No return requested
        // requested → User requested a return
        // approved  → Admin approved the return
        // rejected  → Admin rejected the return
        // received  → Product was received back
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
        // Reason provided by the customer
        // when requesting a return.
        returnReason: {
            type: String,
            default: null
        },
        // Date/time when the user requested the return.
        returnRequestedAt: {
            type: Date,
            default: null
        },
        // Date/time when the return was processed
        // by the admin.
        returnProcessedAt: {
            type: Date,
            default: null
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
// ============================================================
// EXPORT MODEL
// ============================================================
module.exports = Order;