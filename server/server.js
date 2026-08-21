// LOAD ENVIRONMENT VARIABLES
require("dotenv").config();

// IMPORT EXPRESS
const express = require("express");

// IMPORT MONGOOSE
const mongoose = require("mongoose");

// CREATE EXPRESS APPLICATION
const app = express();

// IMPORT CORS
const cors = require("cors");

// GET PORT
const PORT = process.env.PORT || 5000;


// ============================================================
// IMPORT ROUTES
// ============================================================

const authRoutes = require("./src/routes/authRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const adminCustomerRoutes = require("./src/routes/adminCustomerRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const productRoutes = require("./src/routes/productRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const returnRoutes = require("./src/routes/returnRoutes");
const adminReturnRoutes = require("./src/routes/adminReturnRoutes");
const priceAlertRoutes = require("./src/routes/priceAlertRoutes");


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

const errorMiddleware =
    require("./src/middleware/errorMiddleware");

const {
    securityHeaders,
    apiRateLimiter,
    authRateLimiter
} = require("./src/middleware/securityMiddleware");

const validateProductQuery =
    require("./src/middleware/productQueryMiddleware");


// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(securityHeaders);

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}


const clientUrl =
    process.env.CLIENT_URL ||
    "http://localhost:5173";

app.use(
    cors({
        origin: clientUrl
    })
);


// Limit request body size to reduce oversized-request abuse.
app.use(
    express.json({
        limit: "10kb"
    })
);


// General API rate limiting. Authentication routes below also
// receive their stricter authentication-specific limiter.
app.use(
    "/api",
    apiRateLimiter
);


// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

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

app.use(
    "/api/admin/customers",
    adminCustomerRoutes
);


// ============================================================
// PRODUCT / CATEGORY ROUTES
// ============================================================

app.use(
    "/api/categories",
    categoryRoutes
);

// Validate and escape product search/filter parameters before
// productController builds MongoDB queries from them.
app.use(
    "/api/products",
    validateProductQuery
);

app.use(
    "/api/products",
    productRoutes
);


// ============================================================
// CART / ORDER / PAYMENT ROUTES
// ============================================================

app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/orders",
    returnRoutes
);


// ============================================================
// PRICE ALERT / ADMIN RETURN ROUTES
// ============================================================

app.use(
    "/api/price-alerts",
    priceAlertRoutes
);

app.use(
    "/api/admin/returns",
    adminReturnRoutes
);


// ============================================================
// HEALTH / TEST ROUTE
// ============================================================

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to PaisaVasool API"
    });
});


// ============================================================
// ERROR HANDLING
// ============================================================

app.use(errorMiddleware);


// ============================================================
// MONGODB CONNECTION
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(async () => {

        console.log(
            "MongoDB connected successfully"
        );

        // --------------------------------------------------------
        // OPTIONAL ONE-TIME CATALOGUE SEED
        // --------------------------------------------------------
        // This is controlled entirely by the environment variable
        // so normal production startups never modify catalogue data.

        if (
            process.env.SEED_CATALOGUE === "true"
        ) {
            try {
                const seedCatalogue =
                    require("./src/utils/seedCatalogue");

                await seedCatalogue();

                console.log(
                    "Catalogue seed finished successfully."
                );
            } catch (seedError) {
                console.error(
                    "Catalogue seed failed:",
                    seedError.message
                );
            }
        }

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

        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    });
