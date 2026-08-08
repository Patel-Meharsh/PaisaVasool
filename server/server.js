// Load environment variables from the .env file
require("dotenv").config();

// Import Express
const express = require("express");

// Import Mongoose to connect with MongoDB
const mongoose = require("mongoose");

// Create an Express application
const app = express();

// Get the port from .env
// If PORT is not provided, use 5000
const PORT = process.env.PORT || 5000;


// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

// Allows Express to understand JSON data sent in requests
app.use(express.json());


// --------------------------------------------------
// TEST ROUTE
// --------------------------------------------------

// This route is used to check whether our server is working
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to PaisaVasool API"
    });
});


// --------------------------------------------------
// MONGODB CONNECTION
// --------------------------------------------------

// Get the MongoDB connection string from .env
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB Atlas
mongoose
    .connect(MONGO_URI)
    .then(() => {
        // This runs when MongoDB connection is successful
        console.log("MongoDB connected successfully");

        // Start the Express server only after MongoDB connects
        app.listen(PORT, () => {
            console.log(`PaisaVasool server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        // This runs if MongoDB connection fails
        console.error("MongoDB connection failed:", error.message);

        // Stop the application because the database is required
        process.exit(1);
    });