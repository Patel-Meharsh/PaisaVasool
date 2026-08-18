// ============================================================
// ORDER SAFETY CONTROLLER
// Safe cancellation, refunds and order-status transitions.
// ============================================================

const Order = require("../models/Order");
const Product = require("../models/Product");
const razorpay = require("../utils/razorpay");

const {
    sendOrderShippedEmail,
    sendOrderDeliveredEmail
} = require("../utils/sendEmail");


const restoreOrderStock = async (order) => {
    if (!order.inventoryReserved) return;

    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
        );
    }

    order.inventoryReserved = false;
    order.inventoryReleasedAt = new Date();
    order.inventoryReservedUntil = null;
};


const initiateRefund = async (order, reason, receiptPrefix) => {
    if (
        order.paymentMethod !== "online" ||
        order.paymentStatus !== "paid"
    ) {
        return null;
    }

    if (!order.razorpayPaymentId) {
        const error = new Error(
            "Razorpay payment ID is missing. Refund cannot be processed."
        );
        error.statusCode = 400;
        throw error;
    }

    const refundAmount =
        Math.round((order.totalAmount || 0) * 100);

    if (refundAmount <= 0) {
        const error = new Error("Invalid refund amount");
        error.statusCode = 400;
        throw error;
    }

    const claimedOrder = await Order.findOneAndUpdate(
        {
            _id: order._id,
            paymentStatus: "paid",
            refundStatus: "none",
            razorpayRefundId: null
        },
        {
            $set: { refundStatus: "pending" }
        },
        { new: true }
    );

    if (!claimedOrder) {
        const error = new Error(
            "This order is already being processed for refund."
        );
        error.statusCode = 409;
        throw error;
    }

    try {
        const refund = await razorpay.payments.refund(
            claimedOrder.razorpayPaymentId,
            {
                amount: refundAmount,
                speed: "normal",
                notes: {
                    paisaVasoolOrderId:
                        claimedOrder._id.toString(),
                    reason
                },
                receipt:
                    `${receiptPrefix}_${claimedOrder._id}`
            }
        );

        claimedOrder.razorpayRefundId = refund.id;
        claimedOrder.refundAmount = refundAmount / 100;
        claimedOrder.refundStatus =
            refund.status === "processed"
                ? "processed"
                : "initiated";

        await claimedOrder.save();

        return { order: claimedOrder, refund };

    } catch (error) {
        claimedOrder.refundStatus = "failed";
        await claimedOrder.save();
        throw error;
    }
};


const cancelOrderSafely = async (req, res) => {
    try {
        const { id } = req.params;

        let order = await Order.findOne({
            _id: id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!["pending", "confirmed"].includes(order.status)) {
            return res.status(400).json({
                message: "This order cannot be cancelled"
            });
        }

        // A paid online order must obtain a refund before cancellation.
        // If the refund fails, we leave the order untouched and therefore
        // do not restore inventory or create an unpaid/cancelled state.
        let refund = null;

        if (
            order.paymentMethod === "online" &&
            order.paymentStatus === "paid"
        ) {
            try {
                const result = await initiateRefund(
                    order,
                    "Order cancelled by customer",
                    "REFUND"
                );
                order = result.order;
                refund = result.refund;
            } catch (refundError) {
                console.error(
                    "Customer cancellation refund error:",
                    refundError.message
                );
                return res.status(
                    refundError.statusCode || 400
                ).json({
                    message:
                        refundError.statusCode
                            ? refundError.message
                            : "Order cancellation failed because the refund could not be initiated."
                });
            }
        }

        const cancelledOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                user: req.user._id,
                status: { $in: ["pending", "confirmed"] }
            },
            {
                $set: {
                    status: "cancelled"
                }
            },
            { new: true }
        );

        if (!cancelledOrder) {
            return res.status(409).json({
                message:
                    "This order is already being processed or cancelled."
            });
        }

        order = cancelledOrder;
        await restoreOrderStock(order);

        if (refund && refund.status === "processed") {
            order.paymentStatus = "refunded";
        }

        await order.save();

        return res.status(200).json({
            message: refund
                ? "Order cancelled successfully and refund initiated"
                : "Order cancelled successfully and stock restored",
            order
        });

    } catch (error) {
        console.error("Cancel order error:", error.message);

        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        return res.status(500).json({ message: "Server error" });
    }
};


const updateOrderStatusSafely = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        let order = await Order.findById(id)
            .populate("user", "name email");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const allowedTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["shipped", "cancelled"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: []
        };

        if (!allowedTransitions[order.status].includes(status)) {
            return res.status(400).json({
                message:
                    `Order cannot be changed from "${order.status}" to "${status}"`
            });
        }

        if (
            order.paymentMethod === "online" &&
            ["confirmed", "shipped", "delivered"].includes(status) &&
            order.paymentStatus !== "paid"
        ) {
            return res.status(400).json({
                message:
                    "Online orders must be paid before they can be confirmed, shipped or delivered"
            });
        }

        // A failed refund is an explicit financial exception. It must be
        // resolved before an admin can fulfil or cancel the order normally.
        if (
            order.refundStatus === "failed" &&
            ["confirmed", "shipped", "delivered"].includes(status)
        ) {
            return res.status(409).json({
                message:
                    "This order has a failed refund operation and requires financial review before fulfilment."
            });
        }

        if (status === "cancelled") {
            let refund = null;

            if (
                order.paymentMethod === "online" &&
                order.paymentStatus === "paid"
            ) {
                try {
                    const result = await initiateRefund(
                        order,
                        "Order cancelled by administrator",
                        "ADMIN_REFUND"
                    );
                    order = result.order;
                    refund = result.refund;
                } catch (refundError) {
                    console.error(
                        "Admin cancellation refund error:",
                        refundError.message
                    );
                    return res.status(
                        refundError.statusCode || 400
                    ).json({
                        message:
                            refundError.statusCode
                                ? refundError.message
                                : "Order cancellation failed because the refund could not be initiated."
                    });
                }
            }

            const cancelledOrder = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    status: { $in: ["pending", "confirmed"] }
                },
                { $set: { status: "cancelled" } },
                { new: true }
            ).populate("user", "name email");

            if (!cancelledOrder) {
                return res.status(409).json({
                    message:
                        "This order is already being processed or cancelled."
                });
            }

            order = cancelledOrder;
            await restoreOrderStock(order);

            if (refund && refund.status === "processed") {
                order.paymentStatus = "refunded";
            }

            await order.save();

            return res.status(200).json({
                message: refund
                    ? "Order cancelled successfully and refund initiated"
                    : "Order cancelled successfully and stock restored",
                order
            });
        }

        order.status = status;
        await order.save();

        try {
            if (status === "shipped") {
                await sendOrderShippedEmail(
                    order.user.email,
                    order.user.name,
                    order
                );
            }

            if (status === "delivered") {
                await sendOrderDeliveredEmail(
                    order.user.email,
                    order.user.name,
                    order
                );
            }
        } catch (emailError) {
            console.error(
                "Order status email error:",
                emailError.message
            );
        }

        return res.status(200).json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        console.error(
            "Update order status error:",
            error.message
        );

        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    cancelOrderSafely,
    updateOrderStatusSafely
};
