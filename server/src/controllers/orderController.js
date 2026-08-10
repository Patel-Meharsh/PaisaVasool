// Import models
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");


// ============================================================
// CREATE ORDER / CHECKOUT
// ============================================================

const createOrder = async (req, res) => {
    try {

        const {
            shippingAddress,
            paymentMethod
        } = req.body;


        // ----------------------------------------------------
        // 1. Validate shipping address
        // ----------------------------------------------------

        if (
            !shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.address ||
            !shippingAddress.city ||
            !shippingAddress.state ||
            !shippingAddress.postalCode
        ) {
            return res.status(400).json({
                message: "Complete shipping address is required"
            });
        }


        // ----------------------------------------------------
        // 2. Find user's cart
        // ----------------------------------------------------

        const cart = await Cart.findOne({
            user: req.user._id
        }).populate(
            "items.product"
        );


        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty"
            });
        }


        // ----------------------------------------------------
        // 3. Validate stock and calculate total
        // ----------------------------------------------------

        let totalAmount = 0;

        const orderItems = [];


        for (const item of cart.items) {

            const product = item.product;


            // Product may have been deleted/deactivated
            if (!product || !product.isActive) {
                return res.status(400).json({
                    message:
                        "One or more products in your cart are unavailable"
                });
            }


            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message:
                        `Insufficient stock for ${product.name}`
                });
            }


            // Calculate item total
            totalAmount +=
                product.price * item.quantity;


            // Save product information at purchase time
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }


        // ----------------------------------------------------
        // 4. Create order
        // ----------------------------------------------------

        const order = await Order.create({

            user: req.user._id,

            items: orderItems,

            shippingAddress,

            totalAmount,

            paymentMethod:
                paymentMethod || "cod",

            paymentStatus:
                paymentMethod === "online"
                    ? "pending"
                    : "pending",

            status: "pending"
        });


        // ----------------------------------------------------
        // 5. Reduce product stock
        // ----------------------------------------------------

        for (const item of cart.items) {

            await Product.findByIdAndUpdate(
                item.product._id,
                {
                    $inc: {
                        stock: -item.quantity
                    }
                }
            );
        }


        // ----------------------------------------------------
        // 6. Clear user's cart
        // ----------------------------------------------------

        cart.items = [];

        await cart.save();


        // ----------------------------------------------------
        // 7. Return order
        // ----------------------------------------------------

        res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {

        console.error(
            "Create order error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET MY ORDERS
// ============================================================

const getMyOrders = async (req, res) => {
    try {

        const orders = await Order.find({
            user: req.user._id
        })
            .populate(
                "items.product",
                "name images"
            )
            .sort({
                createdAt: -1
            });


        res.status(200).json({
            message: "Orders fetched successfully",
            orders
        });

    } catch (error) {

        console.error(
            "Get my orders error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET SINGLE ORDER
// ============================================================

const getOrderById = async (req, res) => {
    try {

        const { id } = req.params;


        // User can only see their own order
        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        }).populate(
            "items.product",
            "name images"
        );


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        res.status(200).json({
            message: "Order fetched successfully",
            order
        });

    } catch (error) {

        console.error(
            "Get order error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// CANCEL ORDER
// Restore product stock
// ============================================================

const cancelOrder = async (req, res) => {
    try {

        const { id } = req.params;


        // ----------------------------------------------------
        // Find user's order
        // ----------------------------------------------------

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        });


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        // ----------------------------------------------------
        // Only pending or confirmed orders can be cancelled
        // ----------------------------------------------------

        if (
            order.status !== "pending" &&
            order.status !== "confirmed"
        ) {
            return res.status(400).json({
                message:
                    "This order cannot be cancelled"
            });
        }


        // ----------------------------------------------------
        // Restore product stock
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Update order status
        // ----------------------------------------------------

        order.status = "cancelled";


        // If payment was already completed,
        // mark it for refund processing.
        if (order.paymentStatus === "paid") {

            order.paymentStatus = "refunded";
        }


        await order.save();


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(200).json({
            message:
                "Order cancelled successfully and stock restored",

            order
        });

    } catch (error) {

        console.error(
            "Cancel order error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADMIN — GET ALL ORDERS
// ============================================================

const getAllOrders = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate(
                "user",
                "name email"
            )
            .populate(
                "items.product",
                "name"
            )
            .sort({
                createdAt: -1
            });


        res.status(200).json({
            message: "All orders fetched successfully",
            orders
        });

    } catch (error) {

        console.error(
            "Get all orders error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADMIN — UPDATE ORDER STATUS
// ============================================================

const updateOrderStatus = async (req, res) => {
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


        const order = await Order.findByIdAndUpdate(
            id,
            {
                status
            },
            {
                new: true,
                runValidators: true
            }
        );


        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        res.status(200).json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {

        console.error(
            "Update order status error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};