const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const validate = require("../validators/validationMiddleware");
const { createOrderSchema } = require("../validators/orderValidator");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders
} = require("../controllers/orderControllerSafe");

const {
    cancelOrderSafely,
    updateOrderStatusSafely
} = require("../controllers/orderSafetyController");

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
