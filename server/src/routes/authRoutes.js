// Import Express
const express = require("express");

// Create an Express router
const router = express.Router();

// Import the register controller
const { registerUser, verifyEmail, loginUser } = require("../controllers/authController");


// Register a new user
// POST /api/auth/register
router.post("/register", registerUser);

// Verify user's email using OTP
router.post("/verify-email", verifyEmail);

// Login a user
// POST /api/auth/login
router.post("/login", loginUser);


// Export the router
module.exports = router;