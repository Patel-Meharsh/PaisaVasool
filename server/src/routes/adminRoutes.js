const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

// Authentication middleware
// Checks whether the JWT is valid.
const protect = require("../middleware/authMiddleware");


// Authorization middleware
// Checks whether the user has the required role.
const authorize = require("../middleware/roleMiddleware");


// ============================================================
// IMPORT CONTROLLER
// ============================================================

const {
    adminDashboard
} = require("../controllers/adminController");


// ============================================================
// ADMIN ROUTE
// ============================================================

// Request flow:
//
// GET /api/admin/dashboard
//          ↓
//       protect
//          ↓
//       authorize("admin")
//          ↓
//    adminDashboard
//

router.get(
    "/dashboard",
    protect,
    authorize("admin"),
    adminDashboard
);


// Export router
module.exports = router;