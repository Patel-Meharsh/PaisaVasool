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
    getOrderById
} = require("../controllers/orderController");

const {
    cancelOrderSafely,
    updateOrderStatusSafely
} = require("../controllers/orderSafetyController");

const validate = require("../validators/validationMiddleware");
const { createOrderSchema } = require("../validators/orderValidator");


// ============================================================
// USER ROUTES
// ============================================================

router.post(
    "/",
    protect,
    validate(createOrderSchema),
    createOrder
);

router.get(
    "/my-orders",
    protect,
    getMyOrders
);

router.get(
    "/:id",
    protect,
    getOrderById
);

router.put(
    "/:id/cancel",
    protect,
    cancelOrderSafely
);


// ============================================================
// ADMIN ROUTES
// ============================================================

const { getAllOrders } = require("../controllers/orderController");

router.get(
    "/admin/all",
    protect,
    authorize("admin"),
    getAllOrders
);

router.put(
    "/admin/:id/status",
    protect,
    authorize("admin"),
    updateOrderStatusSafely
);


module.exports = router;
