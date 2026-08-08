// Import the Express package
const express = require("express");

// Load environment variables from .env
require("dotenv").config();

// Create an Express application
const app = express();

// Middleware to allow our server to read JSON data
app.use(express.json());

// Get the port from .env
// If PORT is not defined, use 5000
const PORT = process.env.PORT || 5000;

// Simple test route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to PaisaVasool API"
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`PaisaVasool server is running on port ${PORT}`);
});