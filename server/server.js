// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

require("dotenv").config();


// ============================================================
// IMPORT EXPRESS
// ============================================================

const express = require("express");


// ============================================================
// IMPORT MONGOOSE
// ============================================================

const mongoose = require("mongoose");


// ============================================================
// CREATE EXPRESS APPLICATION
// ============================================================

const app = express();


// ============================================================
// GET PORT
// ============================================================

const PORT = process.env.PORT || 5000;


// ============================================================
// IMPORT ROUTES
// ============================================================

// Authentication routes
const authRoutes = require("./src/routes/authRoutes");

// Profile routes
const profileRoutes = require("./src/routes/profileRoutes");

// Admin routes
const adminRoutes = require("./src/routes/adminRoutes");

// Category routes
const categoryRoutes = require("./src/routes/categoryRoutes");

// Product routes
const productRoutes = require("./src/routes/productRoutes");

// Cart routes
const cartRoutes = require("./src/routes/cartRoutes");

// Order routes
const orderRoutes = require("./src/routes/orderRoutes");

// Payment routes
const paymentRoutes = require("./src/routes/paymentRoutes");

// Return routes
const returnRoutes = require("./src/routes/returnRoutes");

// Admin return routes
const adminReturnRoutes = require("./src/routes/adminReturnRoutes");


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

// Centralized error handling
const errorMiddleware =
    require("./src/middleware/errorMiddleware");

// Security middleware
const {
    securityHeaders,
    authRateLimiter
} = require("./src/middleware/securityMiddleware");


// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

// Security headers
app.use(securityHeaders);


// Prevent Express from revealing itself
app.disable("x-powered-by");


// Allow Express to understand JSON data
// Limit request body size to 10 KB
app.use(
    express.json({
        limit: "10kb"
    })
);


// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

// Rate limit authentication requests
app.use(
    "/api/auth",
    authRateLimiter,
    authRoutes
);


// ============================================================
// PROFILE ROUTES
// ============================================================

app.use(
    "/api",
    profileRoutes
);


// ============================================================
// ADMIN ROUTES
// ============================================================

app.use(
    "/api/admin",
    adminRoutes
);


// ============================================================
// CATEGORY ROUTES
// ============================================================

app.use(
    "/api/categories",
    categoryRoutes
);


// ============================================================
// PRODUCT ROUTES
// ============================================================

app.use(
    "/api/products",
    productRoutes
);


// ============================================================
// CART ROUTES
// ============================================================

app.use(
    "/api/cart",
    cartRoutes
);


// ============================================================
// ORDER ROUTES
// ============================================================

app.use(
    "/api/orders",
    orderRoutes
);


// ============================================================
// PAYMENT ROUTES
// ============================================================

app.use(
    "/api/payments",
    paymentRoutes
);


// ============================================================
// RETURN ROUTES
// ============================================================

app.use(
    "/api/orders",
    returnRoutes
);


// ============================================================
// ADMIN RETURN ROUTES
// ============================================================

app.use(
    "/api/admin/returns",
    adminReturnRoutes
);


// ============================================================
// TEST ROUTE
// ============================================================

// Used to check whether the server is working
app.get("/", (req, res) => {

    res.json({

        message:
            "Welcome to PaisaVasool API"

    });

});


// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================

// This MUST be after all routes
app.use(errorMiddleware);


// ============================================================
// MONGODB CONNECTION
// ============================================================

// Get MongoDB connection string from .env
const MONGO_URI = process.env.MONGO_URI;


// Connect to MongoDB Atlas
mongoose

    .connect(MONGO_URI)

    .then(() => {

        // MongoDB connection successful
        console.log(
            "MongoDB connected successfully"
        );


        // Start Express server
        // only after MongoDB connects

        app.listen(
            PORT,
            () => {

                console.log(
                    `PaisaVasool server is running on port ${PORT}`
                );

            }
        );

    })

    .catch((error) => {

        // MongoDB connection failed

        console.error(
            "MongoDB connection failed:",
            error.message
        );


        // Stop application

        process.exit(1);

    });