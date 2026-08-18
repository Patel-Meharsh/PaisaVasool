// ============================================================
// ADMIN RETURN ROUTES
// ============================================================

const express = require("express");
const router = express.Router();


const {
    getReturnRequests,
    approveReturn,
    rejectReturn
} = require("../controllers/adminReturnController");

const {
    processRefundSafely
} = require("../controllers/adminRefundController");


const authMiddleware =
    require("../middleware/authMiddleware");

const authorize =
    require("../middleware/roleMiddleware");


// GET /api/admin/returns
router.get(
    "/",
    authMiddleware,
    authorize("admin"),
    getReturnRequests
);


// PUT /api/admin/returns/:id/approve
router.put(
    "/:id/approve",
    authMiddleware,
    authorize("admin"),
    approveReturn
);


// PUT /api/admin/returns/:id/reject
router.put(
    "/:id/reject",
    authMiddleware,
    authorize("admin"),
    rejectReturn
);


// POST /api/admin/returns/:id/refund
router.post(
    "/:id/refund",
    authMiddleware,
    authorize("admin"),
    processRefundSafely
);


module.exports = router;
