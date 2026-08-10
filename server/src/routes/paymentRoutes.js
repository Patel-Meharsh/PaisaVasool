// ============================================================
// PAYMENT ROUTES
// ============================================================

// Import Express
const express = require("express");

const router = express.Router();


// Import payment controller
const {
    createRazorpayOrder,
    verifyRazorpayPayment
} = require("../controllers/paymentController");


// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");


// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

router.post(
    "/create-order",
    authMiddleware,
    createRazorpayOrder
);


// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

router.post(
    "/verify",
    authMiddleware,
    verifyRazorpayPayment
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;