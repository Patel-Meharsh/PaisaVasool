const mongoose = require("mongoose");

const Order = require("../models/Order");
const User = require("../models/User");

const {
    sendReturnRequestedEmail
} = require("../utils/sendEmail");


// ============================================================
// REQUEST RETURN
// ============================================================

const requestReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        if (
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                message: "Return reason is required"
            });
        }

        const trimmedReason = reason.trim();

        if (trimmedReason.length > 500) {
            return res.status(400).json({
                message:
                    "Return reason must not exceed 500 characters"
            });
        }

        // Atomically claim the return request. The previous
        // find-then-save approach allowed two simultaneous requests
        // to both pass the returnStatus === "none" check.
        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                status: "delivered",
                returnStatus: "none"
            },
            {
                $set: {
                    returnStatus: "requested",
                    returnReason: trimmedReason,
                    returnRequestedAt: new Date()
                }
            },
            {
                new: true
            }
        );

        if (!order) {
            const existingOrder = await Order.findOne({
                _id: id,
                user: req.user._id
            }).select("status returnStatus");

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            if (existingOrder.status !== "delivered") {
                return res.status(400).json({
                    message:
                        "Return can only be requested for delivered orders"
                });
            }

            return res.status(409).json({
                message:
                    "Return has already been requested for this order"
            });
        }

        try {
            const user = await User.findById(
                req.user._id
            );

            if (user) {
                await sendReturnRequestedEmail(
                    user.email,
                    user.name,
                    order
                );
            }

        } catch (emailError) {
            // Return creation has already succeeded. Email failure
            // must not roll back the business operation.
            console.error(
                "Return email error:",
                emailError.message
            );
        }

        return res.status(200).json({
            message:
                "Return request submitted successfully",
            returnRequest: {
                orderId: order._id,
                returnStatus: order.returnStatus,
                reason: order.returnReason,
                requestedAt: order.returnRequestedAt
            }
        });

    } catch (error) {
        console.error(
            "Return request error:",
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
    requestReturn
};
