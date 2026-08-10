const express = require("express");

const router = express.Router();


// ============================================================
// MIDDLEWARE
// ============================================================

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");


// ============================================================
// CONTROLLERS
// ============================================================

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/orderController");


// ============================================================
// USER ROUTES
// ============================================================

// Create order / checkout
// POST /api/orders
router.post(
    "/",
    protect,
    createOrder
);


// Get logged-in user's orders
// GET /api/orders/my-orders
router.get(
    "/my-orders",
    protect,
    getMyOrders
);


// Get one of user's orders
// GET /api/orders/:id
router.get(
    "/:id",
    protect,
    getOrderById
);


// Cancel user's order
// PUT /api/orders/:id/cancel
router.put(
    "/:id/cancel",
    protect,
    cancelOrder
);


// ============================================================
// ADMIN ROUTES
// ============================================================

// Get all orders
// GET /api/orders/admin/all
router.get(
    "/admin/all",
    protect,
    authorize("admin"),
    getAllOrders
);


// Update order status
// PUT /api/orders/admin/:id/status
router.put(
    "/admin/:id/status",
    protect,
    authorize("admin"),
    updateOrderStatus
);


// Export router
module.exports = router;