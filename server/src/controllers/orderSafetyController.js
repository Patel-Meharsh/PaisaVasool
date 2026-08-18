// ============================================================
// ORDER SAFETY CONTROLLER
// Inventory-safe cancellation and admin status transitions.
// ============================================================

const Order = require("../models/Order");
const Product = require("../models/Product");
const razorpay = require("../utils/razorpay");

const {
    sendOrderShippedEmail,
    sendOrderDeliveredEmail
} = require("../utils/sendEmail");


// ============================================================
// HELPERS
// ============================================================

// COD stock is deducted when the order is created.
// Online stock is deducted only after a captured payment.
const isStockDeducted = (order) => (
    order.paymentMethod === "cod" ||
    order.paymentStatus === "paid"
);


const restoreOrderStock = async (order) => {
    if (!isStockDeducted(order)) {
        return;
    }

    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.product,
            {
                $inc: {
                    stock: item.quantity
                }
            }
        );
    }
};


const initiateRefund = async (order, reason, receiptPrefix) => {
    if (order.paymentMethod !== "online" || order.paymentStatus !== "paid") {
        return null;
    }

    if (!order.razorpayPaymentId) {
        const error = new Error(
            "Razorpay payment ID is missing. Refund cannot be processed."
        );
        error.statusCode = 400;
        throw error;
    }

    // Atomically claim the refund operation. This prevents two
    // simultaneous requests from creating two Razorpay refunds.
    const claimedOrder = await Order.findOneAndUpdate(
        {
            _id: order._id,
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
                amount: Math.round(claimedOrder.totalAmount * 100),
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
        claimedOrder.refundStatus =
            refund.status === "processed"
                ? "processed"
                : "initiated";

        await claimedOrder.save();

        return {
            order: claimedOrder,
            refund
        };

    } catch (error) {
        claimedOrder.refundStatus = "failed";
        await claimedOrder.save();
        throw error;
    }
};


// ============================================================
// CUSTOMER — CANCEL ORDER
// ============================================================

const cancelOrderSafely = async (req, res) => {
    try {
        const { id } = req.params;

        let order = await Order.findOne({
            _id: id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (!["pending", "confirmed"].includes(order.status)) {
            return res.status(400).json({
                message: "This order cannot be cancelled"
            });
        }


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


        // Atomically move the order to cancelled so repeated clicks
        // cannot restore inventory more than once.
        const cancelledOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                user: req.user._id,
                status: {
                    $in: ["pending", "confirmed"]
                }
            },
            {
                $set: {
                    status: "cancelled"
                }
            },
            {
                new: true
            }
        );

        if (!cancelledOrder) {
            return res.status(409).json({
                message:
                    "This order is already being processed or cancelled."
            });
        }

        order = cancelledOrder;

        // IMPORTANT: unpaid online orders never reduced stock, so they
        // must not increase inventory when cancelled.
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
        console.error(
            "Cancel order error:",
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
// ADMIN — UPDATE ORDER STATUS
// ============================================================

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
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        let order = await Order.findById(id)
            .populate(
                "user",
                "name email"
            );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
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


        // --------------------------------------------------------
        // ADMIN CANCELLATION
        // --------------------------------------------------------

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

                    order = await Order.findById(order._id)
                        .populate(
                            "user",
                            "name email"
                        );

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
                    status: {
                        $in: ["pending", "confirmed"]
                    }
                },
                {
                    $set: {
                        status: "cancelled"
                    }
                },
                {
                    new: true
                }
            ).populate(
                "user",
                "name email"
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
        }


        // --------------------------------------------------------
        // NORMAL ADMIN STATUS TRANSITION
        // --------------------------------------------------------

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
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    cancelOrderSafely,
    updateOrderStatusSafely
};
