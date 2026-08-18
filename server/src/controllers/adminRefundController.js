// ============================================================
// ADMIN REFUND CONTROLLER
// Safe Razorpay refund processing for approved returns.
// ============================================================

const Order = require("../models/Order");
const razorpay = require("../utils/razorpay");


const processRefundSafely = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                returnStatus: "approved",
                paymentMethod: "online",
                paymentStatus: "paid",
                refundStatus: "none",
                razorpayRefundId: null
            },
            {
                $set: {
                    refundStatus: "pending"
                }
            },
            {
                new: true
            }
        );

        if (!order) {
            const existingOrder = await Order.findById(id);

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            if (existingOrder.paymentStatus === "refunded") {
                return res.status(400).json({
                    message: "Refund has already been processed"
                });
            }

            if (existingOrder.refundStatus === "pending") {
                return res.status(409).json({
                    message:
                        "This refund is already being processed. Please wait."
                });
            }

            return res.status(400).json({
                message:
                    "Order is not eligible for a new refund"
            });
        }


        if (!order.razorpayPaymentId) {
            order.refundStatus = "failed";
            await order.save();

            return res.status(400).json({
                message: "Razorpay payment ID not found"
            });
        }


        try {
            const refund = await razorpay.payments.refund(
                order.razorpayPaymentId,
                {
                    amount:
                        Math.round(order.totalAmount * 100),
                    notes: {
                        paisaVasoolOrderId:
                            order._id.toString(),
                        reason:
                            order.returnReason ||
                            "Customer return"
                    },
                    receipt:
                        `RETURN_REFUND_${order._id}`
                }
            );

            order.razorpayRefundId = refund.id;

            order.refundStatus =
                refund.status === "processed"
                    ? "processed"
                    : "initiated";

            if (refund.status === "processed") {
                order.paymentStatus = "refunded";
            }

            order.returnProcessedAt = new Date();

            await order.save();

            return res.status(200).json({
                message:
                    refund.status === "processed"
                        ? "Refund processed successfully"
                        : "Refund initiated successfully",
                refund: {
                    refundId: refund.id,
                    amount: refund.amount,
                    currency: refund.currency,
                    status: refund.status
                },
                order: {
                    orderId: order._id,
                    paymentStatus: order.paymentStatus,
                    refundStatus: order.refundStatus,
                    returnStatus: order.returnStatus
                }
            });

        } catch (refundError) {
            console.error(
                "Razorpay refund error:",
                refundError.message
            );

            order.refundStatus = "failed";
            await order.save();

            return res.status(400).json({
                message:
                    refundError?.error?.description ||
                    refundError.message ||
                    "Refund processing failed"
            });
        }

    } catch (error) {
        console.error(
            "Admin refund error:",
            error.message
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        return res.status(500).json({
            message: "Refund processing failed"
        });
    }
};


module.exports = {
    processRefundSafely
};
