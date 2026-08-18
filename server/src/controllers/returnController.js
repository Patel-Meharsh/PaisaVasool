const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");

const {
    sendReturnRequestedEmail
} = require("../utils/sendEmail");


const requestReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, items } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        if (typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({
                message: "Return reason is required"
            });
        }

        const trimmedReason = reason.trim();

        if (trimmedReason.length > 500) {
            return res.status(400).json({
                message: "Return reason must not exceed 500 characters"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user._id,
            status: "delivered",
            returnStatus: "none"
        });

        if (!order) {
            const existingOrder = await Order.findOne({
                _id: id,
                user: req.user._id
            }).select("status returnStatus");

            if (!existingOrder) {
                return res.status(404).json({ message: "Order not found" });
            }

            if (existingOrder.status !== "delivered") {
                return res.status(400).json({
                    message:
                        "Return can only be requested for delivered orders"
                });
            }

            return res.status(409).json({
                message: "Return has already been requested for this order"
            });
        }

        // If the client supplies items, validate them strictly. If it does
        // not, preserve the existing full-order-return behaviour.
        const sourceItems =
            Array.isArray(items) && items.length > 0
                ? items
                : order.items.map(item => ({
                    product: item.product,
                    quantity: item.quantity
                }));

        const returnItems = [];
        const seenProducts = new Set();

        for (const requested of sourceItems) {
            if (!requested || !mongoose.Types.ObjectId.isValid(requested.product)) {
                return res.status(400).json({
                    message: "Invalid return product"
                });
            }

            const key = requested.product.toString();

            if (seenProducts.has(key)) {
                return res.status(400).json({
                    message: "A product cannot appear more than once in a return request"
                });
            }

            seenProducts.add(key);

            const orderItem = order.items.find(
                item => item.product.toString() === key
            );

            const quantity = Number(requested.quantity);

            if (
                !orderItem ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > orderItem.quantity
            ) {
                return res.status(400).json({
                    message: "Invalid return quantity for one or more products"
                });
            }

            returnItems.push({
                product: orderItem.product,
                name: orderItem.name,
                price: orderItem.price,
                quantity
            });
        }

        const returnAmount = returnItems.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        if (returnAmount <= 0) {
            return res.status(400).json({
                message: "Return amount must be greater than zero"
            });
        }

        // Atomic state transition prevents duplicate return requests.
        const claimedOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                user: req.user._id,
                status: "delivered",
                returnStatus: "none"
            },
            {
                $set: {
                    returnStatus: "requested",
                    returnReason: trimmedReason,
                    returnItems,
                    returnAmount,
                    returnRequestedAt: new Date(),
                    inventoryRestocked: false
                }
            },
            { new: true }
        );

        if (!claimedOrder) {
            return res.status(409).json({
                message: "Return has already been requested for this order"
            });
        }

        try {
            const user = await User.findById(req.user._id);

            if (user) {
                await sendReturnRequestedEmail(
                    user.email,
                    user.name,
                    claimedOrder
                );
            }
        } catch (emailError) {
            console.error(
                "Return email error:",
                emailError.message
            );
        }

        return res.status(200).json({
            message: "Return request submitted successfully",
            returnRequest: {
                orderId: claimedOrder._id,
                returnStatus: claimedOrder.returnStatus,
                reason: claimedOrder.returnReason,
                items: claimedOrder.returnItems,
                amount: claimedOrder.returnAmount,
                requestedAt: claimedOrder.returnRequestedAt
            }
        });

    } catch (error) {
        console.error("Return request error:", error.message);

        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    requestReturn
};
