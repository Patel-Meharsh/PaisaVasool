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

const authMiddleware =
    require("../middleware/authMiddleware");


// ============================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// ============================================================

const authorize =
    require("../middleware/roleMiddleware");


// ============================================================
// GET ALL RETURN REQUESTS
// ============================================================

// GET /api/admin/returns

router.get(
    "/",
    authMiddleware,
    authorize("admin"),
    getReturnRequests
);


// ============================================================
// APPROVE RETURN
// ============================================================

// PUT /api/admin/returns/:id/approve

router.put(
    "/:id/approve",
    authMiddleware,
    authorize("admin"),
    approveReturn
);


// ============================================================
// REJECT RETURN
// ============================================================

// PUT /api/admin/returns/:id/reject

router.put(
    "/:id/reject",
    authMiddleware,
    authorize("admin"),
    rejectReturn
);


// ============================================================
// PROCESS REFUND
// ============================================================

// POST /api/admin/returns/:id/refund

router.post(
    "/:id/refund",
    authMiddleware,
    authorize("admin"),
    processRefund
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;