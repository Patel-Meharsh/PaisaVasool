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

// Import authentication routes
const authRoutes = require("./src/routes/authRoutes");

//Import profile routes
const profileRoutes = require("./src/routes/profileRoutes");

//Import admin routes
const adminRoutes = require("./src/routes/adminRoutes");

//Import category routes
const categoryRoutes = require("./src/routes/categoryRoutes");

//Import product routes
const productRoutes = require("./src/routes/productRoutes");

//Import cart routes
const cartRoutes = require("./src/routes/cartRoutes");

//Import order routes
const orderRoutes = require("./src/routes/orderRoutes");

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

// Allows Express to understand JSON data sent in requests
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

//Profile routes
app.use("/api", profileRoutes);

//Admin routes
app.use("/api/admin", adminRoutes);

//Category routes
app.use("/api/categories", categoryRoutes);

//Product routes
app.use("/api/products", productRoutes);

//Cart routes
app.use("/api/cart", cartRoutes);

//Order routes
app.use("/api/orders", orderRoutes);


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