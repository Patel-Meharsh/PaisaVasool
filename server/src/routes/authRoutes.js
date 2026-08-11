// Import Express
const express = require("express");

// Create an Express router
const router = express.Router();

// Import the register controller
const { registerUser, verifyEmail, loginUser } = require("../controllers/authController");

const validate = require("../validators/validationMiddleware");

const { registerSchema, loginSchema } = require("../validators/authValidator");


// Register a new user
// POST /api/auth/register
router.post("/register", validate(registerSchema), registerUser);

// Verify user's email using OTP
router.post("/verify-email", verifyEmail);

// Login a user
// POST /api/auth/login
router.post("/login", validate(loginSchema), loginUser);


// Export the router
module.exports = router;