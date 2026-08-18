// ============================================================
// RAZORPAY WEBHOOK ROUTES
// ============================================================

const express = require("express");
const router = express.Router();

const {
    handleRazorpayWebhook
} = require("../controllers/paymentWebhookController");


// Razorpay signatures must be calculated from the exact raw request
// body, so this route intentionally uses express.raw instead of the
// application's normal express.json parser.
router.post(
    "/razorpay",
    express.raw({
        type: "application/json",
        limit: "20kb"
    }),
    handleRazorpayWebhook
);


module.exports = router;
