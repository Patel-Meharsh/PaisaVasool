// ============================================================
// ADMIN RETURN ROUTES
// ============================================================

// Import Express
const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {
    getReturnRequests,
    approveReturn,
    rejectReturn,
    processRefund
} = require("../controllers/adminReturnController");


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

const authMiddleware = require("../middleware/authMiddleware");


// ============================================================
// GET ALL RETURN REQUESTS
// ============================================================

router.get(
    "/",
    authMiddleware,
    getReturnRequests
);


// ============================================================
// APPROVE RETURN
// ============================================================
//
// PUT /api/admin/returns/:id/approve
//
// :id = PaisaVasool Order ID
// ============================================================

router.put(
    "/:id/approve",
    authMiddleware,
    approveReturn
);


// ============================================================
// REJECT RETURN
// ============================================================
//
// PUT /api/admin/returns/:id/reject
// ============================================================

router.put(
    "/:id/reject",
    authMiddleware,
    rejectReturn
);


// ============================================================
// PROCESS REFUND
// ============================================================
//
// POST /api/admin/returns/:id/refund
// ============================================================

router.post(
    "/:id/refund",
    authMiddleware,
    processRefund
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;