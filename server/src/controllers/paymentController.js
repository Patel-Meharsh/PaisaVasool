// ============================================================
// PAYMENT CONTROLLER
// ============================================================

const mongoose = require("mongoose");
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


const releaseOrderReservation = async (orderId, cancelOrder = true) => {
    const released = await Order.findOneAndUpdate(
        {
            _id: orderId,
            inventoryReserved: true
        },
        {
            $set: {
                inventoryReserved: false,
                inventoryReleasedAt: new Date(),
                inventoryReservedUntil: null,
                ...(cancelOrder
                    ? {
                        status: "cancelled",
                        paymentStatus: "failed"
                    }
                    : {})
            }
        },
        { returnDocument: "after" }
    );

    if (!released) return null;

    for (const item of released.items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
        );
    }

    return released;
};


const refundCapturedPayment = async (
    order,
    razorpayPaymentId,
    amountInPaise,
    reason
) => {
    try {
        const refund = await razorpay.payments.refund(
            razorpayPaymentId,
            {
                amount: amountInPaise,
                notes: {
                    paisaVasoolOrderId: order._id.toString(),
                    reason
                },
                receipt: `AUTO_REFUND_${order._id}`
            }
        );

        order.razorpayPaymentId = razorpayPaymentId;
        order.refundAmount = amountInPaise / 100;
        order.razorpayRefundId = refund.id;
        order.refundStatus =
            refund.status === "processed"
                ? "processed"
                : "initiated";
        order.paymentStatus =
            refund.status === "processed"
                ? "refunded"
                : "paid";
        order.status = "cancelled";
        order.paymentProcessingAt = null;
        await order.save();

        return refund;
    } catch (error) {
        order.razorpayPaymentId = razorpayPaymentId;
        order.refundAmount = amountInPaise / 100;
        order.paymentStatus = "paid";
        order.refundStatus = "failed";
        order.paymentProcessingAt = null;
        await order.save();
        throw error;
    }
};


const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Valid order ID is required"
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentMethod !== "online") {
            return res.status(400).json({
                message: "This order is not configured for online payment"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled orders cannot be paid"
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                message: "This order has already been paid"
            });
        }

        if (!order.inventoryReserved) {
            return res.status(409).json({
                message:
                    "Inventory is no longer reserved for this order. Please create a new order."
            });
        }

        if (
            order.inventoryReservedUntil &&
            order.inventoryReservedUntil <= new Date()
        ) {
            await releaseOrderReservation(order._id);
            return res.status(409).json({
                message:
                    "The payment reservation has expired. Please create a new order."
            });
        }

        if (order.totalAmount <= 0) {
            return res.status(400).json({ message: "Invalid order amount" });
        }

        if (order.razorpayOrderId) {
            const existingRazorpayOrder =
                await razorpay.orders.fetch(order.razorpayOrderId);

            const expectedAmount =
                Math.round(order.totalAmount * 100);

            if (
                Number(existingRazorpayOrder.amount) !== expectedAmount ||
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

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
            receipt: `PV_${order._id}`,
            notes: {
                paisaVasoolOrderId: order._id.toString(),
                userId: req.user._id.toString()
            }
        });

        order.razorpayOrderId = razorpayOrder.id;
        order.paymentStatus = "pending";
        await order.save();

        return res.status(201).json({
            message: "Razorpay order created successfully",
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });

    } catch (error) {
        console.error("Create Razorpay order error:", error.message);
        return res.status(500).json({
            message: "Failed to create payment order"
        });
    }
};


const verifyRazorpayPayment = async (req, res) => {
    let order = null;

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
                message: "Payment verification data is incomplete"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                user: req.user._id,
                razorpayOrderId,
                paymentMethod: "online",
                paymentStatus: "pending",
                status: "pending",
                inventoryReserved: true,
                inventoryReservedUntil: { $gt: new Date() }
            },
            {
                $set: {
                    paymentStatus: "processing",
                    paymentProcessingAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        if (!order) {
            const existingOrder = await Order.findOne({
                _id: orderId,
                user: req.user._id
            });

            if (!existingOrder) {
                return res.status(404).json({ message: "Order not found" });
            }

            if (existingOrder.paymentStatus === "paid") {
                return res.status(200).json({
                    message: "Payment already verified",
                    payment: {
                        orderId: existingOrder._id,
                        paymentStatus: existingOrder.paymentStatus
                    }
                });
            }

            if (
                existingOrder.paymentStatus === "processing" &&
                existingOrder.paymentProcessingAt &&
                Date.now() - existingOrder.paymentProcessingAt.getTime() < 2 * 60 * 1000
            ) {
                return res.status(409).json({
                    message:
                        "Payment verification is already being processed. Please wait."
                });
            }

            if (
                existingOrder.inventoryReservedUntil &&
                existingOrder.inventoryReservedUntil <= new Date()
            ) {
                await releaseOrderReservation(existingOrder._id);
            }

            return res.status(409).json({
                message:
                    "This payment reservation is no longer valid. Please create a new order."
            });
        }

        const isSignatureValid = validatePaymentVerification(
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
            await releaseOrderReservation(order._id);

            return res.status(400).json({
                message: "Payment verification failed"
            });
        }

        const payment = await razorpay.payments.fetch(
            razorpayPaymentId
        );

        const expectedAmount =
            Math.round(order.totalAmount * 100);

        const detailsMatch =
            payment.order_id === order.razorpayOrderId &&
            Number(payment.amount) === expectedAmount &&
            payment.currency === "INR" &&
            payment.status === "captured";

        if (!detailsMatch) {
            if (payment.status === "captured") {
                try {
                    await refundCapturedPayment(
                        order,
                        razorpayPaymentId,
                        Number(payment.amount) || expectedAmount,
                        "Payment details did not match PaisaVasool order"
                    );
                } catch (refundError) {
                    console.error(
                        "Automatic mismatch refund error:",
                        refundError.message
                    );
                }

                await releaseOrderReservation(order._id, false);

            } else {
                order.paymentStatus = "failed";
                order.paymentProcessingAt = null;
                await order.save();
                await releaseOrderReservation(order._id);
            }

            return res.status(400).json({
                message: "Payment details do not match the order"
            });
        }

        const finalized = await Order.findOneAndUpdate(
            {
                _id: order._id,
                paymentStatus: "processing",
                inventoryReserved: true,
                status: "pending"
            },
            {
                $set: {
                    razorpayPaymentId,
                    razorpaySignature,
                    paymentStatus: "paid",
                    status: "confirmed",
                    paymentProcessingAt: null,
                    inventoryReservedUntil: null
                }
            },
            { returnDocument: "after" }
        );

        if (!finalized) {
            return res.status(409).json({
                message:
                    "Payment finalization state changed. Please check your order before retrying."
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            const orderSnapshot = finalized.items
                .map(item => ({
                    product: item.product.toString(),
                    quantity: item.quantity
                }))
                .sort((a, b) => a.product.localeCompare(b.product));

            const cartSnapshot = cart.items
                .map(item => ({
                    product: item.product.toString(),
                    quantity: item.quantity
                }))
                .sort((a, b) => a.product.localeCompare(b.product));

            if (JSON.stringify(orderSnapshot) === JSON.stringify(cartSnapshot)) {
                cart.items = [];
                await cart.save();
            }
        }

        try {
            await sendOrderPlacedEmail(
                req.user.email,
                req.user.name,
                finalized
            );
        } catch (emailError) {
            console.error("Order email error:", emailError.message);
        }

        return res.status(200).json({
            message:
                "Payment verified and order confirmed successfully",
            payment: {
                orderId: finalized._id,
                razorpayOrderId: finalized.razorpayOrderId,
                razorpayPaymentId: finalized.razorpayPaymentId,
                paymentStatus: finalized.paymentStatus
            }
        });

    } catch (error) {
        console.error("Payment verification error:", error.message);

        if (order) {
            try {
                if (order.paymentStatus === "processing") {
                    order.paymentStatus = "failed";
                    order.paymentProcessingAt = null;
                    await order.save();
                    await releaseOrderReservation(order._id);
                }
            } catch (saveError) {
                console.error(
                    "Payment failure cleanup error:",
                    saveError.message
                );
            }
        }

        return res.status(500).json({
            message: "Payment verification failed due to a server error"
        });
    }
};


module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment
};
