const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { sendOrderPlacedEmail } = require("../utils/sendEmail");

const ONLINE_RESERVATION_MS = 15 * 60 * 1000;

const releaseExpiredReservations = async () => {
    const now = new Date();
    const expiredOrders = await Order.find({
        paymentMethod: "online",
        status: "pending",
        inventoryReserved: true,
        inventoryReservedUntil: { $lte: now }
    }).select("_id items");

    for (const candidate of expiredOrders) {
        const claimed = await Order.findOneAndUpdate(
            {
                _id: candidate._id,
                status: "pending",
                inventoryReserved: true,
                inventoryReservedUntil: { $lte: now }
            },
            {
                $set: {
                    inventoryReserved: false,
                    inventoryReleasedAt: now,
                    inventoryReservedUntil: null,
                    status: "cancelled",
                    paymentStatus: "failed"
                }
            },
            { new: true }
        );

        if (!claimed) continue;

        for (const item of claimed.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }
    }
};


const createOrder = async (req, res) => {
    const reservedProducts = [];
    let createdOrder = null;

    try {
        const { shippingAddress, paymentMethod } = req.body;

        if (!shippingAddress) {
            return res.status(400).json({
                message: "Complete shipping address is required"
            });
        }

        if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }

        await releaseExpiredReservations();

        const cart = await Cart.findOne({
            user: req.user._id
        }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Your cart is empty" });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.product;

            if (!product || !product.isActive) {
                return res.status(400).json({
                    message: "One or more products in your cart are unavailable"
                });
            }

            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return res.status(400).json({
                    message: "Invalid product quantity in cart"
                });
            }

            totalAmount += product.price * item.quantity;
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                images: Array.isArray(product.images)
                    ? [...product.images]
                    : []
            });
        }

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ message: "Invalid order amount" });
        }

        // Atomic stock reservation prevents two customers from reserving
        // the same final units concurrently.
        for (const item of cart.items) {
            const reserved = await Product.findOneAndUpdate(
                {
                    _id: item.product._id,
                    isActive: true,
                    stock: { $gte: item.quantity }
                },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (!reserved) {
                for (const previous of reservedProducts) {
                    await Product.findByIdAndUpdate(
                        previous.productId,
                        { $inc: { stock: previous.quantity } }
                    );
                }

                return res.status(409).json({
                    message:
                        "Stock changed while processing your order. Please review your cart and try again."
                });
            }

            reservedProducts.push({
                productId: item.product._id,
                quantity: item.quantity
            });
        }

        createdOrder = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            totalAmount,
            paymentMethod,
            paymentStatus: "pending",
            status: "pending",
            inventoryReserved: true,
            inventoryReservedUntil:
                paymentMethod === "online"
                    ? new Date(Date.now() + ONLINE_RESERVATION_MS)
                    : null
        });

        // Preserve the existing online-payment behaviour: the cart remains
        // until Razorpay verification succeeds. COD can be cleared now.
        if (paymentMethod === "cod") {
            cart.items = [];
            await cart.save();

            try {
                await sendOrderPlacedEmail(
                    req.user.email,
                    req.user.name,
                    createdOrder
                );
            } catch (emailError) {
                console.error("Order email error:", emailError.message);
            }
        }

        return res.status(201).json({
            message:
                paymentMethod === "online"
                    ? "Order created. Payment required. Stock has been reserved for 15 minutes."
                    : "Order placed successfully",
            order: createdOrder
        });

    } catch (error) {
        for (const reserved of reservedProducts) {
            try {
                await Product.findByIdAndUpdate(
                    reserved.productId,
                    { $inc: { stock: reserved.quantity } }
                );
            } catch (rollbackError) {
                console.error(
                    "Order stock rollback error:",
                    rollbackError.message
                );
            }
        }

        if (createdOrder) {
            try {
                await Order.deleteOne({ _id: createdOrder._id });
            } catch (deleteError) {
                console.error(
                    "Failed to delete incomplete order:",
                    deleteError.message
                );
            }
        }

        console.error("Create order error:", error.message);
        return res.status(500).json({
            message: "Server error while creating order"
        });
    }
};


const getMyOrders = async (req, res) => {
    try {
        await releaseExpiredReservations();
        const orders = await Order.find({ user: req.user._id })
            .populate("items.product", "name images")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Orders fetched successfully",
            orders
        });
    } catch (error) {
        console.error("Get my orders error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate("items.product", "name images");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order fetched successfully",
            order
        });
    } catch (error) {
        console.error("Get order error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const getAllOrders = async (req, res) => {
    try {
        await releaseExpiredReservations();
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("items.product", "name images")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "All orders fetched successfully",
            orders
        });
    } catch (error) {
        console.error("Get all orders error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    releaseExpiredReservations
};
