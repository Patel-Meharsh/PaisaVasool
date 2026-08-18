// ============================================================
// RAZORPAY WEBHOOK CONTROLLER
// ============================================================

const crypto = require("crypto");

const Order = require("../models/Order");
const Product = require("../models/Product");
const razorpay = require("../utils/razorpay");


// ============================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================

const verifyWebhookSignature = (rawBody, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
    );
};


// ============================================================
// FINALIZE CAPTURED PAYMENT
// ============================================================

const finalizeCapturedPayment = async (order, paymentId) => {
    const expectedAmount =
        Math.round(order.totalAmount * 100);

    // Always fetch the payment from Razorpay instead of trusting the
    // webhook payload for amount, currency or capture status.
    const payment = await razorpay.payments.fetch(paymentId);

    if (
        payment.order_id !== order.razorpayOrderId ||
        Number(payment.amount) !== expectedAmount ||
        payment.currency !== "INR" ||
        payment.status !== "captured"
    ) {
        return {
            handled: false,
            retry: false,
            reason: "Payment details do not match the order"
        };
    }

    // A payment verification request can crash after claiming an order.
    // Allow a webhook to reclaim only a stale processing attempt.
    const staleProcessingCutoff = new Date(
        Date.now() - 5 * 60 * 1000
    );

    const claimFilter = {
        _id: order._id,
        paymentMethod: "online",
        razorpayOrderId: order.razorpayOrderId,
        paymentStatus: {
            $in: ["pending", "processing"]
        },
        $or: [
            { paymentStatus: "pending" },
            {
                paymentStatus: "processing",
                paymentProcessingAt: {
                    $lt: staleProcessingCutoff
                }
            }
        ]
    };

    const claimedOrder = await Order.findOneAndUpdate(
        claimFilter,
        {
            $set: {
                paymentStatus: "processing",
                paymentProcessingAt: new Date(),
                razorpayPaymentId: paymentId
            }
        },
        {
            new: true
        }
    );

    if (!claimedOrder) {
        const currentOrder = await Order.findById(order._id);

        return {
            handled: currentOrder?.paymentStatus === "paid" ||
                currentOrder?.paymentStatus === "refunded",
            retry:
                currentOrder?.paymentStatus === "processing",
            reason:
                currentOrder?.paymentStatus === "paid" ||
                currentOrder?.paymentStatus === "refunded"
                    ? "Payment already finalized"
                    : "Payment finalization is already in progress"
        };
    }

    const updatedProducts = [];

    try {
        for (const item of claimedOrder.items) {
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
                // Roll back stock already reserved during this attempt.
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

                try {
                    const refund =
                        await razorpay.payments.refund(
                            paymentId,
                            {
                                amount: expectedAmount,
                                notes: {
                                    paisaVasoolOrderId:
                                        claimedOrder._id.toString(),
                                    reason:
                                        "Insufficient stock after payment"
                                }
                            }
                        );

                    claimedOrder.razorpayRefundId =
                        refund.id;
                    claimedOrder.paymentStatus =
                        "refunded";
                    claimedOrder.refundStatus =
                        refund.status === "processed"
                            ? "processed"
                            : "initiated";
                    claimedOrder.status = "cancelled";
                    claimedOrder.paymentProcessingAt = null;

                    await claimedOrder.save();

                    return {
                        handled: true,
                        retry: false,
                        refunded: true
                    };

                } catch (refundError) {
                    // Payment was captured. Keep it marked paid so the
                    // failed refund is visible for manual reconciliation.
                    claimedOrder.paymentStatus = "paid";
                    claimedOrder.refundStatus = "failed";
                    claimedOrder.paymentProcessingAt = null;
                    await claimedOrder.save();

                    console.error(
                        "Webhook stock refund error:",
                        refundError.message
                    );

                    return {
                        handled: true,
                        retry: false,
                        refunded: false,
                        reason:
                            "Payment captured but automatic refund failed"
                    };
                }
            }

            updatedProducts.push({
                productId: item.product,
                quantity: item.quantity
            });
        }

        claimedOrder.razorpayPaymentId = paymentId;
        claimedOrder.paymentStatus = "paid";
        claimedOrder.status = "confirmed";
        claimedOrder.paymentProcessingAt = null;

        await claimedOrder.save();

        return {
            handled: true,
            retry: false,
            refunded: false
        };

    } catch (error) {
        // Keep the order in processing. Returning 500 causes Razorpay to
        // retry the signed webhook instead of losing the captured payment.
        console.error(
            "Webhook payment finalization error:",
            error.message
        );

        return {
            handled: false,
            retry: true,
            reason: "Payment finalization requires another attempt"
        };
    }
};


// ============================================================
// RAZORPAY WEBHOOK
// ============================================================

const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];

        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).json({
                message: "Invalid webhook body"
            });
        }

        if (!verifyWebhookSignature(req.body, signature)) {
            return res.status(401).json({
                message: "Invalid webhook signature"
            });
        }

        let payload;

        try {
            payload = JSON.parse(req.body.toString("utf8"));
        } catch (error) {
            return res.status(400).json({
                message: "Invalid webhook payload"
            });
        }

        const event = payload.event;

        // --------------------------------------------------------
        // PAYMENT CAPTURED
        // --------------------------------------------------------

        if (event === "payment.captured") {
            const paymentEntity =
                payload.payload?.payment?.entity;

            const razorpayOrderId =
                paymentEntity?.order_id;

            const paymentId =
                paymentEntity?.id;

            if (!razorpayOrderId || !paymentId) {
                return res.status(400).json({
                    message: "Incomplete payment webhook payload"
                });
            }

            const order = await Order.findOne({
                razorpayOrderId,
                paymentMethod: "online"
            });

            // Unknown orders are acknowledged because they do not belong
            // to this application and should not trigger endless retries.
            if (!order) {
                return res.status(200).json({
                    message: "Webhook received"
                });
            }

            const result = await finalizeCapturedPayment(
                order,
                paymentId
            );

            if (result.retry) {
                return res.status(500).json({
                    message:
                        "Payment finalization is incomplete; retry required"
                });
            }

            return res.status(200).json({
                message: "Payment webhook processed"
            });
        }

        // --------------------------------------------------------
        // PAYMENT FAILED
        // --------------------------------------------------------

        if (event === "payment.failed") {
            const paymentEntity =
                payload.payload?.payment?.entity;

            const razorpayOrderId =
                paymentEntity?.order_id;

            const paymentId =
                paymentEntity?.id;

            if (razorpayOrderId) {
                await Order.findOneAndUpdate(
                    {
                        razorpayOrderId,
                        paymentMethod: "online",
                        paymentStatus: {
                            $in: ["pending", "processing"]
                        }
                    },
                    {
                        $set: {
                            paymentStatus: "failed",
                            paymentProcessingAt: null,
                            razorpayPaymentId:
                                paymentId || null
                        }
                    }
                );
            }

            return res.status(200).json({
                message: "Payment failure webhook processed"
            });
        }

        // --------------------------------------------------------
        // REFUND EVENTS
        // --------------------------------------------------------

        if (
            event === "refund.processed" ||
            event === "refund.failed"
        ) {
            const refundEntity =
                payload.payload?.refund?.entity;

            const refundId =
                refundEntity?.id;

            if (refundId) {
                await Order.findOneAndUpdate(
                    {
                        razorpayRefundId: refundId
                    },
                    {
                        $set: {
                            refundStatus:
                                event === "refund.processed"
                                    ? "processed"
                                    : "failed",
                            paymentStatus:
                                event === "refund.processed"
                                    ? "refunded"
                                    : "paid"
                        }
                    }
                );
            }

            return res.status(200).json({
                message: "Refund webhook processed"
            });
        }

        // Unknown but validly signed events are acknowledged safely.
        return res.status(200).json({
            message: "Webhook received"
        });

    } catch (error) {
        console.error(
            "Razorpay webhook error:",
            error.message
        );

        // Returning 500 allows Razorpay to retry transient failures.
        return res.status(500).json({
            message: "Webhook processing failed"
        });
    }
};


module.exports = {
    handleRazorpayWebhook
};
