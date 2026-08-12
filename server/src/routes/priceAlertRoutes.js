const express = require("express");

const router = express.Router();

// ============================================================
// MIDDLEWARE
// ============================================================

const protect = require("../middleware/authMiddleware");

// ============================================================
// CONTROLLERS
// ============================================================

const {
    createPriceAlert,
    getMyPriceAlerts,
    deletePriceAlert
} = require("../controllers/priceAlertController");


// ============================================================
// PRICE ALERT ROUTES
// ============================================================

// Create a price alert
// POST /api/price-alerts

router.post(
    "/",
    protect,
    createPriceAlert
);


// Get logged-in user's price alerts
// GET /api/price-alerts

router.get(
    "/",
    protect,
    getMyPriceAlerts
);


// Delete user's price alert
// DELETE /api/price-alerts/:id

router.delete(
    "/:id",
    protect,
    deletePriceAlert
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;