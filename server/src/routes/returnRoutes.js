// ============================================================
// RETURN ROUTES
// ============================================================

// Import Express
const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT CONTROLLER
// ============================================================

const {
    requestReturn
} = require("../controllers/returnController");


// ============================================================
// IMPORT AUTHENTICATION MIDDLEWARE
// ============================================================

const authMiddleware = require("../middleware/authMiddleware");


// ============================================================
// REQUEST RETURN
// ============================================================
//
// POST /api/orders/:id/return
//
// :id = PaisaVasool Order ID
//
// Example:
//
// POST /api/orders/68a123456789abcdef123456/return
//
// ============================================================

router.post(
    "/:id/return",
    authMiddleware,
    requestReturn
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;