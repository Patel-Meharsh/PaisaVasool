// ============================================================
// RETURN CONTROLLER
// ============================================================

// Import Order model
const Order = require("../models/Order");


// ============================================================
// REQUEST RETURN
// ============================================================

const requestReturn = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Get Order ID from URL
        // ----------------------------------------------------
        //
        // Example:
        // POST /api/orders/68a123.../return
        //
        // req.params.id = Order._id
        // ----------------------------------------------------

        const { id } = req.params;


        // ----------------------------------------------------
        // Get return reason from request body
        // ----------------------------------------------------

        const { reason } = req.body;


        // ----------------------------------------------------
        // Validate return reason
        // ----------------------------------------------------

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: "Return reason is required"
            });
        }


        // ----------------------------------------------------
        // Find the order
        // ----------------------------------------------------
        //
        // We also check the user.
        //
        // This prevents one user from requesting a return
        // for another user's order.
        // ----------------------------------------------------

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        });


        // ----------------------------------------------------
        // Check whether order exists
        // ----------------------------------------------------

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Return can only be requested for delivered orders
        // ----------------------------------------------------

        if (order.status !== "delivered") {
            return res.status(400).json({
                message:
                    "Return can only be requested for delivered orders"
            });
        }


        // ----------------------------------------------------
        // Check whether return was already requested
        // ----------------------------------------------------

        if (order.returnStatus !== "none") {
            return res.status(400).json({
                message:
                    "Return has already been requested for this order"
            });
        }


        // ----------------------------------------------------
        // Save return information
        // ----------------------------------------------------

        order.returnStatus = "requested";

        order.returnReason = reason.trim();

        order.returnRequestedAt = new Date();


        // ----------------------------------------------------
        // Save order
        // ----------------------------------------------------

        await order.save();


        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

        res.status(200).json({

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


        // ----------------------------------------------------
        // Handle invalid MongoDB ObjectId
        // ----------------------------------------------------

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }


        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    requestReturn
};