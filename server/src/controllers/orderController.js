// ============================================================
// IMPORT MODELS
// ============================================================

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");


// ============================================================
// IMPORT EMAIL FUNCTIONS
// ============================================================

const {
    sendOrderPlacedEmail,
    sendOrderShippedEmail,
    sendOrderDeliveredEmail
} = require("../utils/sendEmail");


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
                "pending",

            status:
                "pending"

        });


        // ----------------------------------------------------
        // 5. Reduce product stock safely
        // ----------------------------------------------------

        const updatedProducts = [];


        for (const item of cart.items) {

            const updatedProduct =
                await Product.findOneAndUpdate(

                    {
                        _id: item.product._id,

                        isActive: true,

                        stock: {
                            $gte: item.quantity
                        }
                    },

                    {
                        $inc: {
                            stock: -item.quantity
                        }
                    },

                    {
                        new: true
                    }

                );


            // ------------------------------------------------
            // Stock changed between validation and update
            // ------------------------------------------------

            if (!updatedProduct) {

                // Restore stock for products that were
                // already updated during this order.

                for (const updatedItem of updatedProducts) {

                    await Product.findByIdAndUpdate(

                        updatedItem.productId,

                        {
                            $inc: {
                                stock: updatedItem.quantity
                            }
                        }

                    );

                }


                // Delete the order because stock deduction
                // could not be completed.

                await Order.findByIdAndDelete(
                    order._id
                );


                return res.status(400).json({

                    message:
                        "Stock changed while processing your order. Please review your cart and try again."

                });

            }


            updatedProducts.push({

                productId:
                    item.product._id,

                quantity:
                    item.quantity

            });

        }


        // ----------------------------------------------------
        // 6. Clear user's cart
        // ----------------------------------------------------

        cart.items = [];

        await cart.save();


        // ----------------------------------------------------
        // 7. Send order placed email
        // ----------------------------------------------------

        try {

            await sendOrderPlacedEmail(

                req.user.email,

                req.user.name,

                order

            );

        } catch (emailError) {

            console.error(
                "Order email error:",
                emailError.message
            );

        }


        // ----------------------------------------------------
        // 8. Send response
        // ----------------------------------------------------

        res.status(201).json({

            message:
                "Order placed successfully",

            order

        });


    } catch (error) {

        console.error(
            "Create order error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error"

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

            message:
                "Orders fetched successfully",

            orders

        });


    } catch (error) {

        console.error(

            "Get my orders error:",

            error.message

        );


        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// GET SINGLE ORDER
// ============================================================

const getOrderById = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        // User can only see their own order

        const order = await Order.findOne({

            _id: id,

            user: req.user._id

        })

            .populate(

                "items.product",

                "name images"

            );


        if (!order) {

            return res.status(404).json({

                message:
                    "Order not found"

            });

        }


        res.status(200).json({

            message:
                "Order fetched successfully",

            order

        });


    } catch (error) {

        console.error(

            "Get order error:",

            error.message

        );


        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// CANCEL ORDER
// Restore product stock
// ============================================================

const cancelOrder = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        // ----------------------------------------------------
        // Find user's order
        // ----------------------------------------------------

        const order = await Order.findOne({

            _id: id,

            user: req.user._id

        });


        if (!order) {

            return res.status(404).json({

                message:
                    "Order not found"

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

                        stock:
                            item.quantity

                    }

                }

            );

        }


        // ----------------------------------------------------
        // Update order status
        // ----------------------------------------------------

        order.status =
            "cancelled";


        // ----------------------------------------------------
        // Handle refund status
        // ----------------------------------------------------
        //
        // If payment was completed, do NOT immediately
        // mark it as "refunded".
        //
        // Actual Razorpay refund processing must happen
        // separately.
        //
        // ----------------------------------------------------

        if (
            order.paymentStatus === "paid"
        ) {

            order.refundStatus =
                "pending";

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

            message:
                "Server error"

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

            message:
                "All orders fetched successfully",

            orders

        });


    } catch (error) {

        console.error(

            "Get all orders error:",

            error.message

        );


        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// ADMIN — UPDATE ORDER STATUS
// ============================================================

const updateOrderStatus = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const {
            status
        } = req.body;


        // ----------------------------------------------------
        // Allowed order statuses
        // ----------------------------------------------------

        const allowedStatuses = [

            "pending",

            "confirmed",

            "shipped",

            "delivered",

            "cancelled"

        ];


        // ----------------------------------------------------
        // Validate status
        // ----------------------------------------------------

        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                message:
                    "Invalid order status"

            });

        }


        // ----------------------------------------------------
        // Find the order
        // ----------------------------------------------------

        const order = await Order.findById(id)

            .populate(

                "user",

                "name email"

            );


        if (!order) {

            return res.status(404).json({

                message:
                    "Order not found"

            });

        }


        // ----------------------------------------------------
        // Validate order status transition
        // ----------------------------------------------------
        //
        // pending
        //    ↓
        // confirmed
        //    ↓
        // shipped
        //    ↓
        // delivered
        //
        // Cancellation is allowed only from
        // pending or confirmed.
        //
        // ----------------------------------------------------

        const allowedTransitions = {

            pending: [

                "confirmed",

                "cancelled"

            ],

            confirmed: [

                "shipped",

                "cancelled"

            ],

            shipped: [

                "delivered"

            ],

            delivered: [],

            cancelled: []

        };


        if (

            !allowedTransitions[order.status]

                .includes(status)

        ) {

            return res.status(400).json({

                message:
                    `Order cannot be changed from "${order.status}" to "${status}"`

            });

        }


        // ----------------------------------------------------
        // Update status
        // ----------------------------------------------------

        order.status =
            status;


        await order.save();


        // ----------------------------------------------------
        // Send status-specific emails
        // ----------------------------------------------------

        try {

            // --------------------------------------------
            // SHIPPED
            // --------------------------------------------

            if (
                status === "shipped"
            ) {

                await sendOrderShippedEmail(

                    order.user.email,

                    order.user.name,

                    order

                );

            }


            // --------------------------------------------
            // DELIVERED
            // --------------------------------------------

            if (
                status === "delivered"
            ) {

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


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Order status updated successfully",

            order

        });


    } catch (error) {

        console.error(

            "Update order status error:",

            error.message

        );


        res.status(500).json({

            message:
                "Server error"

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