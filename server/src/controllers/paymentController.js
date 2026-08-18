// ============================================================
// PAYMENT CONTROLLER
// ============================================================

const razorpay = require("../utils/razorpay");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const {
    validatePaymentVerification
} = require("razorpay/dist/utils/razorpay-utils");

const {
    sendOrderPlacedEmail
} = require("../utils/sendEmail");


// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

const createRazorpayOrder = async (req, res) => {

    try {

        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                message: "Order ID is required"
            });
        }


        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        if (order.paymentMethod !== "online") {
            return res.status(400).json({
                message:
                    "This order is not configured for online payment"
            });
        }


        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                message: "This order has already been paid"
            });
        }


        if (order.totalAmount <= 0) {
            return res.status(400).json({
                message: "Invalid order amount"
            });
        }


        if (order.razorpayOrderId) {

            const existingRazorpayOrder =
                await razorpay.orders.fetch(
                    order.razorpayOrderId
                );

            const expectedAmount =
                Math.round(order.totalAmount * 100);

            if (
                Number(existingRazorpayOrder.amount) !==
                expectedAmount ||
                existingRazorpayOrder.currency !== "INR"
            ) {
                return res.status(409).json({
                    message:
                        "Existing payment order does not match the PaisaVasool order"
                });
            }

            return res.status(200).json({
                message: "Existing Razorpay order found",
                razorpayOrder: {
                    id: existingRazorpayOrder.id,
                    amount: existingRazorpayOrder.amount,
                    currency: existingRazorpayOrder.currency
                }
            });
        }


        const amountInPaise =
            Math.round(order.totalAmount * 100);

        const razorpayOrder =
            await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `PV_${order._id}`,
                notes: {
                    paisaVasoolOrderId:
                        order._id.toString(),
                    userId:
                        req.user._id.toString()
                }
            });


        order.razorpayOrderId =
            razorpayOrder.id;

        order.paymentStatus = "pending";

        await order.save();


        return res.status(201).json({
            message:
                "Razorpay order created successfully",
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });

    } catch (error) {

        console.error(
            "Create Razorpay order error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to create payment order"
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


        // Atomically claim the order for payment finalization.
        // Only one request can move an unpaid order into processing.
        const order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                user: req.user._id,
                razorpayOrderId,
                paymentMethod: "online",
                paymentStatus: "pending"
            },
            {
                $set: {
                    paymentStatus: "processing",
                    paymentProcessingAt: new Date()
                }
            },
            {
                new: true
            }
        );


        if (!order) {

            const existingOrder = await Order.findOne({
                _id: orderId,
                user: req.user._id
            });

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            if (existingOrder.paymentStatus === "paid") {
                return res.status(200).json({
                    message: "Payment already verified",
                    payment: {
                        orderId: existingOrder._id,
                        paymentStatus:
                            existingOrder.paymentStatus
                    }
                });
            }

            if (existingOrder.paymentStatus === "processing") {
                return res.status(409).json({
                    message:
                        "Payment verification is already being processed. Please wait."
                });
            }

            return res.status(400).json({
                message:
                    "This payment cannot be verified in its current state"
            });
        }


        // --------------------------------------------------------
        // Verify the Razorpay signature
        // --------------------------------------------------------

        const isSignatureValid =
            validatePaymentVerification(
                {
                    order_id: order.razorpayOrderId,
                    payment_id: razorpayPaymentId
                },
                razorpaySignature,
                process.env.RAZORPAY_KEY_SECRET
            );


        if (!isSignatureValid) {

            order.paymentStatus = "failed";
            order.paymentProcessingAt = null;

            await order.save();

            return res.status(400).json({
                message: "Payment verification failed"
            });
        }


        // --------------------------------------------------------
        // Ask Razorpay for the actual payment details.
        // Signature verification alone is not enough: the backend
        // must also verify the payment amount, currency, order and
        // captured status before marking the order as paid.
        // --------------------------------------------------------

        const payment =
            await razorpay.payments.fetch(
                razorpayPaymentId
            );

        const expectedAmount =
            Math.round(order.totalAmount * 100);


        if (
            payment.order_id !== order.razorpayOrderId ||
            Number(payment.amount) !== expectedAmount ||
            payment.currency !== "INR" ||
            payment.status !== "captured"
        ) {

            order.paymentStatus = "failed";
            order.paymentProcessingAt = null;

            await order.save();

            return res.status(400).json({
                message:
                    "Payment details do not match the order"
            });
        }


        // --------------------------------------------------------
        // Reduce stock atomically
        // --------------------------------------------------------

        const updatedProducts = [];

        for (const item of order.items) {

            const updatedProduct =
                await Product.findOneAndUpdate(
                    {
                        _id: item.product,
                        isActive: true,
                        stock: {
                            $gte: item.quantity
                        }
                    },
                    {
                        $inc: {
                            stock: -item.quantity
                        }
                    },
                    {
                        new: true
                    }
                );


            if (!updatedProduct) {

                // Roll back stock already reduced in this request.
                for (const updatedItem of updatedProducts) {

                    await Product.findByIdAndUpdate(
                        updatedItem.productId,
                        {
                            $inc: {
                                stock: updatedItem.quantity
                            }
                        }
                    );
                }


                // The payment was captured, so try to refund it rather
                // than marking a successfully captured payment as failed.
                try {

                    const refund =
                        await razorpay.payments.refund(
                            razorpayPaymentId,
                            {
                                amount: expectedAmount,
                                notes: {
                                    paisaVasoolOrderId:
                                        order._id.toString(),
                                    reason:
                                        "Insufficient stock after payment"
                                }
                            }
                        );

                    order.razorpayPaymentId =
                        razorpayPaymentId;

                    order.razorpaySignature =
                        razorpaySignature;

                    order.razorpayRefundId =
                        refund.id;

                    order.paymentStatus =
                        "refunded";

                    order.refundStatus =
                        refund.status === "processed"
                            ? "processed"
                            : "initiated";

                    order.status = "cancelled";
                    order.paymentProcessingAt = null;

                    await order.save();

                    return res.status(409).json({
                        message:
                            `Payment was received, but stock for ${item.name} was unavailable. The payment has been refunded.`
                    });

                } catch (refundError) {

                    order.razorpayPaymentId =
                        razorpayPaymentId;

                    order.razorpaySignature =
                        razorpaySignature;

                    order.paymentStatus = "paid";
                    order.refundStatus = "failed";
                    order.paymentProcessingAt = null;

                    await order.save();

                    return res.status(502).json({
                        message:
                            "Payment was received but stock could not be reserved. A refund could not be completed automatically and requires review."
                    });
                }
            }


            updatedProducts.push({
                productId: item.product,
                quantity: item.quantity
            });
        }


        // --------------------------------------------------------
        // Clear the cart only if it still exactly matches the order
        // snapshot. If the user changed the cart while paying, do
        // not delete those newer cart changes.
        // --------------------------------------------------------

        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (cart) {

            const orderSnapshot = order.items
                .map(item => ({
                    product:
                        item.product.toString(),
                    quantity: item.quantity
                }))
                .sort((a, b) =>
                    a.product.localeCompare(b.product)
                );

            const cartSnapshot = cart.items
                .map(item => ({
                    product:
                        item.product.toString(),
                    quantity: item.quantity
                }))
                .sort((a, b) =>
                    a.product.localeCompare(b.product)
                );

            const cartMatchesOrder =
                JSON.stringify(orderSnapshot) ===
                JSON.stringify(cartSnapshot);

            if (cartMatchesOrder) {
                cart.items = [];
                await cart.save();
            }
        }


        // --------------------------------------------------------
        // Finalize order
        // --------------------------------------------------------

        order.razorpayPaymentId =
            razorpayPaymentId;

        order.razorpaySignature =
            razorpaySignature;

        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.paymentProcessingAt = null;

        await order.save();


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


        return res.status(200).json({
            message:
                "Payment verified and order confirmed successfully",
            payment: {
                orderId: order._id,
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
