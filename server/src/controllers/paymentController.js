// ============================================================
// PAYMENT CONTROLLER
// ============================================================

const razorpay = require("../utils/razorpay");

const Order = require("../models/Order");

const Cart = require("../models/Cart");

const Product = require("../models/Product");


// Razorpay verification helper

const {
    validatePaymentVerification
} = require("razorpay/dist/utils/razorpay-utils");


// Email functions

const {
    sendOrderPlacedEmail
} = require("../utils/sendEmail");


// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

const createRazorpayOrder = async (req, res) => {

    try {

        const {
            orderId
        } = req.body;


        if (!orderId) {

            return res.status(400).json({

                message:
                    "Order ID is required"

            });

        }


        // ----------------------------------------------------
        // Find user's PaisaVasool order
        // ----------------------------------------------------

        const order =
            await Order.findOne({

                _id: orderId,

                user: req.user._id

            });


        if (!order) {

            return res.status(404).json({

                message:
                    "Order not found"

            });

        }


        // ----------------------------------------------------
        // Make sure it is an online order
        // ----------------------------------------------------

        if (
            order.paymentMethod !== "online"
        ) {

            return res.status(400).json({

                message:
                    "This order is not configured for online payment"

            });

        }


        // ----------------------------------------------------
        // Already paid?
        // ----------------------------------------------------

        if (
            order.paymentStatus === "paid"
        ) {

            return res.status(400).json({

                message:
                    "This order has already been paid"

            });

        }


        // ----------------------------------------------------
        // Existing Razorpay order
        // ----------------------------------------------------
        //
        // This allows the user to retry payment if
        // the previous Razorpay window was closed.
        // ----------------------------------------------------

        if (order.razorpayOrderId) {

            const existingRazorpayOrder =
                await razorpay.orders.fetch(
                    order.razorpayOrderId
                );


            return res.status(200).json({

                message:
                    "Existing Razorpay order found",

                razorpayOrder: {

                    id:
                        existingRazorpayOrder.id,

                    amount:
                        existingRazorpayOrder.amount,

                    currency:
                        existingRazorpayOrder.currency

                }

            });

        }


        // ----------------------------------------------------
        // Convert amount to paise
        // ----------------------------------------------------

        const amountInPaise =
            Math.round(
                order.totalAmount * 100
            );


        // ----------------------------------------------------
        // Create Razorpay order
        // ----------------------------------------------------

        const razorpayOrder =
            await razorpay.orders.create({

                amount:
                    amountInPaise,

                currency:
                    "INR",

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
        // Response
        // ----------------------------------------------------

        return res.status(201).json({

            message:
                "Razorpay order created successfully",

            razorpayOrder: {

                id:
                    razorpayOrder.id,

                amount:
                    razorpayOrder.amount,

                currency:
                    razorpayOrder.currency

            }

        });


    } catch (error) {

        console.error(
            "Create Razorpay order error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to create payment order"

        });

    }

};


// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

const verifyRazorpayPayment = async (req, res) => {

    try {

        const {

            orderId,

            razorpayOrderId,

            razorpayPaymentId,

            razorpaySignature

        } = req.body;


        // ----------------------------------------------------
        // Validate request
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
        // Find PaisaVasool order
        // ----------------------------------------------------

        const order =
            await Order.findOne({

                _id: orderId,

                user: req.user._id

            });


        if (!order) {

            return res.status(404).json({

                message:
                    "Order not found"

            });

        }


        // ----------------------------------------------------
        // Make sure Razorpay order matches OUR database
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
        // Prevent duplicate verification
        // ----------------------------------------------------

        if (
            order.paymentStatus === "paid"
        ) {

            return res.status(200).json({

                message:
                    "Payment already verified",

                payment: {

                    orderId:
                        order._id,

                    paymentStatus:
                        order.paymentStatus

                }

            });

        }


        // ====================================================
        // VERIFY RAZORPAY SIGNATURE
        // ====================================================

        const isSignatureValid =
            validatePaymentVerification(

                {
                    order_id:
                        order.razorpayOrderId,

                    payment_id:
                        razorpayPaymentId

                },

                razorpaySignature,

                process.env.RAZORPAY_KEY_SECRET

            );


        if (!isSignatureValid) {

            order.paymentStatus =
                "failed";

            await order.save();


            return res.status(400).json({

                message:
                    "Payment verification failed"

            });

        }


        // ====================================================
        // SIGNATURE VALID
        // ====================================================
        //
        // The payment is now authenticated.
        //
        // Only NOW do we finalize the order.
        // ====================================================


        // ----------------------------------------------------
        // Find user's cart
        // ----------------------------------------------------

        const cart =
            await Cart.findOne({

                user:
                    req.user._id

            });


        if (
            !cart ||
            cart.items.length === 0
        ) {

            return res.status(400).json({

                message:
                    "Cart is empty. Payment was verified but the order could not be finalized."

            });

        }


        // ----------------------------------------------------
        // Reduce stock
        // ----------------------------------------------------

        const updatedProducts = [];


        for (const item of order.items) {

            const updatedProduct =
                await Product.findOneAndUpdate(

                    {

                        _id:
                            item.product,

                        isActive:
                            true,

                        stock: {
                            $gte:
                                item.quantity
                        }

                    },

                    {

                        $inc: {
                            stock:
                                -item.quantity
                        }

                    },

                    {

                        new:
                            true

                    }

                );


            if (!updatedProduct) {

                // Restore already reduced products

                for (
                    const updatedItem
                    of updatedProducts
                ) {

                    await Product.findByIdAndUpdate(

                        updatedItem.productId,

                        {

                            $inc: {

                                stock:
                                    updatedItem.quantity

                            }

                        }

                    );

                }


                return res.status(400).json({

                    message:
                        `Insufficient stock for ${item.name}. Payment was verified, but the order could not be fulfilled.`

                });

            }


            updatedProducts.push({

                productId:
                    item.product,

                quantity:
                    item.quantity

            });

        }


        // ----------------------------------------------------
        // Clear cart
        // ----------------------------------------------------

        cart.items = [];

        await cart.save();


        // ----------------------------------------------------
        // Save payment information
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
        // Send order confirmation email
        // ----------------------------------------------------

        try {

            await sendOrderPlacedEmail(

                req.user.email,

                req.user.name,

                order

            );

        } catch (emailError) {

            console.error(

                "Order email error:",

                emailError.message

            );

        }


        // ----------------------------------------------------
        // Success response
        // ----------------------------------------------------

        return res.status(200).json({

            message:
                "Payment verified and order confirmed successfully",

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
            error
        );


        return res.status(500).json({

            message:
                "Payment verification failed due to a server error"

        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    createRazorpayOrder,

    verifyRazorpayPayment

};