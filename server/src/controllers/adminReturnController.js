const mongoose = require("mongoose");
const Order = require("../models/Order");

const {
    sendReturnApprovedEmail,
    sendReturnRejectedEmail
} = require("../utils/sendEmail");


const getReturnRequests = async (req, res) => {
    try {
        const orders = await Order.find({
            returnStatus: {
                $in: ["requested", "approved", "rejected", "received"]
            }
        })
            .populate("user", "name email")
            .populate("items.product", "name")
            .populate("returnItems.product", "name");

        return res.status(200).json({
            message: "Return requests fetched successfully",
            returns: orders
        });
    } catch (error) {
        console.error("Get return requests error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const approveReturn = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                returnStatus: "requested",
                returnAmount: { $gt: 0 }
            },
            {
                $set: {
                    returnStatus: "approved",
                    returnProcessedAt: new Date()
                }
            },
            { returnDocument: "after" }
        ).populate("user", "name email");

        if (!order) {
            const existingOrder = await Order.findById(id)
                .select("returnStatus returnAmount");

            if (!existingOrder) {
                return res.status(404).json({ message: "Order not found" });
            }

            return res.status(409).json({
                message: "This return request has already been processed or is invalid"
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
            message: "Return request approved successfully",
            order: {
                orderId: order._id,
                returnStatus: order.returnStatus,
                returnReason: order.returnReason,
                returnItems: order.returnItems,
                returnAmount: order.returnAmount
            }
        });

    } catch (error) {
        console.error("Approve return error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const rejectReturn = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

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
            { returnDocument: "after" }
        ).populate("user", "name email");

        if (!order) {
            const existingOrder = await Order.findById(id)
                .select("returnStatus");

            if (!existingOrder) {
                return res.status(404).json({ message: "Order not found" });
            }

            return res.status(409).json({
                message: "This return request has already been processed"
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
            message: "Return request rejected successfully",
            order: {
                orderId: order._id,
                returnStatus: order.returnStatus,
                returnReason: order.returnReason
            }
        });

    } catch (error) {
        console.error("Reject return error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


module.exports = {
    getReturnRequests,
    approveReturn,
    rejectReturn
};
