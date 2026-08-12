// ============================================================
// ADMIN RETURN CONTROLLER
// ============================================================

// Import Order model
const Order = require("../models/Order");

// Import Razorpay instance
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

        // ----------------------------------------------------
        // Make sure only admins can access this
        // ----------------------------------------------------

        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required"
            });
        }


        // ----------------------------------------------------
        // Find all orders where return was requested
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Admin authorization
        // ----------------------------------------------------

        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required"
            });
        }


        // ----------------------------------------------------
        // Get order ID
        // ----------------------------------------------------

        const { id } = req.params;


        // ----------------------------------------------------
        // Find order
        // ----------------------------------------------------

        const order = await Order.findById(id)
        .populate(
            "user",
            "name email"
        );


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Return must be in requested state
        // ----------------------------------------------------

        if (order.returnStatus !== "requested") {
            return res.status(400).json({
                message:
                    "This return request cannot be approved"
            });
        }


        // ----------------------------------------------------
        // Approve return
        // ----------------------------------------------------

        order.returnStatus = "approved";

        order.returnProcessedAt = new Date();


        await order.save();


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


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(200).json({

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

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADMIN - REJECT RETURN
// ============================================================

const rejectReturn = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Admin authorization
        // ----------------------------------------------------

        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required"
            });
        }


        // ----------------------------------------------------
        // Get order ID
        // ----------------------------------------------------

        const { id } = req.params;


        // ----------------------------------------------------
        // Find order
        // ----------------------------------------------------

        const order = await Order.findById(id)
        .populate(
            "user",
            "name email"
        );


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Return must be in requested state
        // ----------------------------------------------------

        if (order.returnStatus !== "requested") {
            return res.status(400).json({
                message:
                    "This return request cannot be rejected"
            });
        }


        // ----------------------------------------------------
        // Reject return
        // ----------------------------------------------------

        order.returnStatus = "rejected";

        order.returnProcessedAt = new Date();


        await order.save();

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


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(200).json({

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

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADMIN - PROCESS RAZORPAY REFUND
// ============================================================

const processRefund = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Admin authorization
        // ----------------------------------------------------

        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access required"
            });
        }


        // ----------------------------------------------------
        // Get order ID
        // ----------------------------------------------------

        const { id } = req.params;


        // ----------------------------------------------------
        // Find order
        // ----------------------------------------------------

        const order = await Order.findById(id);


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Return must be approved first
        // ----------------------------------------------------

        if (order.returnStatus !== "approved") {
            return res.status(400).json({
                message:
                    "Return must be approved before refund"
            });
        }


        // ----------------------------------------------------
        // Only online paid orders can be refunded through
        // Razorpay.
        // ----------------------------------------------------

        if (order.paymentMethod !== "online") {
            return res.status(400).json({
                message:
                    "Razorpay refund is only available for online payments"
            });
        }


        if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                message:
                    "Only paid orders can be refunded"
            });
        }


        // ----------------------------------------------------
        // Make sure Razorpay payment ID exists
        // ----------------------------------------------------

        if (!order.razorpayPaymentId) {
            return res.status(400).json({
                message:
                    "Razorpay payment ID not found"
            });
        }


        // ----------------------------------------------------
        // Prevent duplicate refund
        // ----------------------------------------------------

        if (
            order.refundStatus === "processed" ||
            order.paymentStatus === "refunded"
        ) {
            return res.status(400).json({
                message:
                    "Refund has already been processed"
            });
        }


        // ----------------------------------------------------
        // Mark refund as pending
        // ----------------------------------------------------

        order.refundStatus = "pending";

        await order.save();


        // ----------------------------------------------------
        // Create Razorpay refund
        // ----------------------------------------------------

        const refund =
            await razorpay.payments.refund(
                order.razorpayPaymentId,
                {
                    amount:
                        Math.round(
                            order.totalAmount * 100
                        ),

                    notes: {
                        paisaVasoolOrderId:
                            order._id.toString(),

                        reason:
                            order.returnReason ||
                            "Customer return"
                    }
                }
            );


        // ----------------------------------------------------
        // Save refund information
        // ----------------------------------------------------

        order.razorpayRefundId =
            refund.id;

        order.refundStatus =
            "processed";

        order.paymentStatus =
            "refunded";

        order.returnProcessedAt =
            new Date();


        await order.save();


        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Refund processed successfully",

            refund: {
                refundId:
                    refund.id,

                amount:
                    refund.amount,

                currency:
                    refund.currency,

                status:
                    refund.status
            },

            order: {
                orderId:
                    order._id,

                paymentStatus:
                    order.paymentStatus,

                refundStatus:
                    order.refundStatus,

                returnStatus:
                    order.returnStatus
            }

        });

    } catch (error) {

        console.error(
            "Refund processing error:",
            error.message
        );


        // ----------------------------------------------------
        // If Razorpay refund fails
        // ----------------------------------------------------

        try {

            if (req.params.id) {

                await Order.findByIdAndUpdate(
                    req.params.id,
                    {
                        refundStatus: "failed"
                    }
                );
            }

        } catch (updateError) {

            console.error(
                "Refund status update error:",
                updateError.message
            );
        }


        res.status(500).json({
            message: "Refund processing failed"
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    getReturnRequests,
    approveReturn,
    rejectReturn,
    processRefund
};