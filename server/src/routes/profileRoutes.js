const express = require("express");

const router = express.Router();


// Import JWT authentication middleware
const protect = require("../middleware/authMiddleware");


// Import profile controller
const {
    getProfile
} = require("../controllers/profileController");


// ============================================================
// PROTECTED PROFILE ROUTE
// ============================================================

// The protect middleware runs BEFORE getProfile.
//
// Request flow:
//
// GET /api/profile
//        ↓
// protect
//        ↓
// JWT valid?
//        ↓
// getProfile
//
router.get("/profile", protect, getProfile);


// Export router
module.exports = router;