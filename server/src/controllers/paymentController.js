// ============================================================
// PAYMENT CONTROLLER
// ============================================================

// Import Razorpay instance
const razorpay = require("../utils/razorpay");

// Import Order model
const Order = require("../models/Order");


// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

const createRazorpayOrder = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Get PaisaVasool order ID
        // ----------------------------------------------------

        const { orderId } = req.body;


        // ----------------------------------------------------
        // Validate order ID
        // ----------------------------------------------------

        if (!orderId) {
            return res.status(400).json({
                message: "Order ID is required"
            });
        }


        // ----------------------------------------------------
        // Find the user's order
        // ----------------------------------------------------

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Make sure this order uses online payment
        // ----------------------------------------------------

        if (order.paymentMethod !== "online") {
            return res.status(400).json({
                message:
                    "This order is not configured for online payment"
            });
        }


        // ----------------------------------------------------
        // Prevent creating another Razorpay order
        // ----------------------------------------------------

        if (order.razorpayOrderId) {
            return res.status(400).json({
                message:
                    "Razorpay order already exists for this order",
                razorpayOrderId:
                    order.razorpayOrderId
            });
        }


        // ----------------------------------------------------
        // Convert amount to paise
        // ----------------------------------------------------
        // PaisaVasool stores amount in rupees.
        //
        // Razorpay expects amount in the smallest currency unit.
        //
        // Example:
        // ₹2499 → 249900 paise
        // ----------------------------------------------------

        const amountInPaise =
            Math.round(order.totalAmount * 100);


        // ----------------------------------------------------
        // Create Razorpay order
        // ----------------------------------------------------

        const razorpayOrder =
            await razorpay.orders.create({

                amount: amountInPaise,

                currency: "INR",

                receipt:
                    `PV_${order._id}`,

                notes: {
                    paisaVasoolOrderId:
                        order._id.toString(),

                    userId:
                        req.user._id.toString()
                }
            });


        // ----------------------------------------------------
        // Save Razorpay order ID
        // ----------------------------------------------------

        order.razorpayOrderId =
            razorpayOrder.id;

        order.paymentStatus =
            "pending";

        await order.save();


        // ----------------------------------------------------
        // Send Razorpay order information
        // to frontend
        // ----------------------------------------------------

        res.status(201).json({

            message:
                "Razorpay order created successfully",

            razorpayOrder: {
                id: razorpayOrder.id,

                amount:
                    razorpayOrder.amount,

                currency:
                    razorpayOrder.currency
            }

        });

    } catch (error) {

        console.error(
            "Create Razorpay order error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};



// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

const verifyRazorpayPayment = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Get payment information from frontend
        // ----------------------------------------------------

        const {
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = req.body;


        // ----------------------------------------------------
        // Validate required fields
        // ----------------------------------------------------

        if (
            !orderId ||
            !razorpayOrderId ||
            !razorpayPaymentId ||
            !razorpaySignature
        ) {
            return res.status(400).json({
                message:
                    "Payment verification data is incomplete"
            });
        }


        // ----------------------------------------------------
        // Find user's order
        // ----------------------------------------------------

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Make sure Razorpay order matches
        // our PaisaVasool order
        // ----------------------------------------------------

        if (
            order.razorpayOrderId !==
            razorpayOrderId
        ) {
            return res.status(400).json({
                message:
                    "Razorpay order does not match"
            });
        }


        // ----------------------------------------------------
        // Create signature
        // ----------------------------------------------------
        //
        // Razorpay signature verification uses:
        //
        // HMAC SHA256
        //
        // Data:
        //
        // razorpayOrderId + "|" + razorpayPaymentId
        //
        // Secret:
        //
        // RAZORPAY_KEY_SECRET
        // ----------------------------------------------------

        const crypto = require("crypto");

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpayOrderId}|${razorpayPaymentId}`
                )
                .digest("hex");


        // ----------------------------------------------------
        // Compare signatures
        // ----------------------------------------------------

        if (
            generatedSignature !==
            razorpaySignature
        ) {

            order.paymentStatus =
                "failed";

            await order.save();

            return res.status(400).json({
                message:
                    "Payment verification failed"
            });
        }


        // ----------------------------------------------------
        // Payment verified successfully
        // ----------------------------------------------------

        order.razorpayPaymentId =
            razorpayPaymentId;

        order.razorpaySignature =
            razorpaySignature;

        order.paymentStatus =
            "paid";

        order.status =
            "confirmed";


        await order.save();


        // ----------------------------------------------------
        // Send successful response
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Payment verified successfully",

            payment: {
                orderId:
                    order._id,

                razorpayOrderId:
                    order.razorpayOrderId,

                razorpayPaymentId:
                    order.razorpayPaymentId,

                paymentStatus:
                    order.paymentStatus
            }

        });

    } catch (error) {

        console.error(
            "Payment verification error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};



// ============================================================
// EXPORT CONTROLLER FUNCTIONS
// ============================================================

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment
};