const express = require("express");

const router = express.Router();


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

const protect =
    require("../middleware/authMiddleware");


// ============================================================
// PROFILE CONTROLLERS
// ============================================================

const {

    getProfile,

    updateProfile

} = require("../controllers/profileController");


// ============================================================
// GET PROFILE
// ============================================================

// GET /api/profile
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

router.get(
    "/profile",
    protect,
    getProfile
);


// ============================================================
// UPDATE PROFILE
// ============================================================

// PUT /api/profile
//
// Request flow:
//
// PUT /api/profile
//        ↓
// protect
//        ↓
// JWT valid?
//        ↓
// updateProfile

router.put(
    "/profile",
    protect,
    updateProfile
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;