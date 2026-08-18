const mongoose = require("mongoose");

const Order = require("../models/Order");
const razorpay = require("../utils/razorpay");

const {
    sendReturnApprovedEmail,
    sendReturnRejectedEmail
} = require("../utils/sendEmail");


// ============================================================
// ADMIN - GET RETURN REQUESTS
// ============================================================

const getReturnRequests = async (req, res) => {
    try {
        const orders = await Order.find({
            returnStatus: {
                $in: [
                    "requested",
                    "approved",
                    "rejected",
                    "received"
                ]
            }
        })
            .populate("user", "name email")
            .populate("items.product", "name");

        res.status(200).json({
            message: "Return requests fetched successfully",
            returns: orders
        });

    } catch (error) {
        console.error(
            "Get return requests error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADMIN - APPROVE RETURN
// ============================================================

const approveReturn = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        // Atomically claim the requested state so two admins cannot
        // both approve the same return concurrently.
        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                returnStatus: "requested"
            },
            {
                $set: {
                    returnStatus: "approved",
                    returnProcessedAt: new Date()
                }
            },
            {
                new: true
            }
        ).populate(
            "user",
            "name email"
        );

        if (!order) {
            const existingOrder = await Order.findById(id)
                .select("returnStatus");

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            return res.status(409).json({
                message:
                    "This return request has already been processed"
            });
        }

        try {
            await sendReturnApprovedEmail(
                order.user.email,
                order.user.name,
                order
            );
        } catch (emailError) {
            console.error(
                "Return approval email error:",
                emailError.message
            );
        }

        return res.status(200).json({
            message:
                "Return request approved successfully",
            order: {
                orderId: order._id,
                returnStatus: order.returnStatus,
                returnReason: order.returnReason
            }
        });

    } catch (error) {
        console.error(
            "Approve return error:",
            error.message
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADMIN - REJECT RETURN
// ============================================================

const rejectReturn = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        // Atomically claim the requested state so two admins cannot
        // approve/reject the same return at the same time.
        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                returnStatus: "requested"
            },
            {
                $set: {
                    returnStatus: "rejected",
                    returnProcessedAt: new Date()
                }
            },
            {
                new: true
            }
        ).populate(
            "user",
            "name email"
        );

        if (!order) {
            const existingOrder = await Order.findById(id)
                .select("returnStatus");

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            return res.status(409).json({
                message:
                    "This return request has already been processed"
            });
        }

        try {
            await sendReturnRejectedEmail(
                order.user.email,
                order.user.name,
                order
            );
        } catch (emailError) {
            console.error(
                "Return rejection email error:",
                emailError.message
            );
        }

        return res.status(200).json({
            message:
                "Return request rejected successfully",
            order: {
                orderId: order._id,
                returnStatus: order.returnStatus,
                returnReason: order.returnReason
            }
        });

    } catch (error) {
        console.error(
            "Reject return error:",
            error.message
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// LEGACY REFUND CONTROLLER
// ============================================================
// Kept for compatibility with any older imports. The active route
// uses adminRefundController.processRefundSafely, which is atomic.

const processRefund = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            returnStatus: "approved",
            paymentMethod: "online",
            paymentStatus: "paid"
        });

        if (!order) {
            return res.status(400).json({
                message: "Order is not eligible for refund"
            });
        }

        if (
            order.refundStatus !== "none" ||
            order.razorpayRefundId
        ) {
            return res.status(409).json({
                message:
                    "This order already has a refund operation in progress or completed"
            });
        }

        const claimedOrder = await Order.findOneAndUpdate(
            {
                _id: id,
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

        if (!claimedOrder) {
            return res.status(409).json({
                message:
                    "This refund is already being processed"
            });
        }

        try {
            const refund = await razorpay.payments.refund(
                claimedOrder.razorpayPaymentId,
                {
                    amount:
                        Math.round(
                            claimedOrder.totalAmount * 100
                        ),
                    notes: {
                        paisaVasoolOrderId:
                            claimedOrder._id.toString(),
                        reason:
                            claimedOrder.returnReason ||
                            "Customer return"
                    },
                    receipt:
                        `RETURN_REFUND_${claimedOrder._id}`
                }
            );

            claimedOrder.razorpayRefundId = refund.id;
            claimedOrder.refundStatus =
                refund.status === "processed"
                    ? "processed"
                    : "initiated";

            if (refund.status === "processed") {
                claimedOrder.paymentStatus = "refunded";
            }

            claimedOrder.returnProcessedAt = new Date();
            await claimedOrder.save();

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
                }
            });

        } catch (refundError) {
            claimedOrder.refundStatus = "failed";
            await claimedOrder.save();

            return res.status(400).json({
                message:
                    refundError?.error?.description ||
                    refundError.message ||
                    "Refund processing failed"
            });
        }

    } catch (error) {
        console.error(
            "Refund processing error:",
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
    getReturnRequests,
    approveReturn,
    rejectReturn,
    processRefund
};
