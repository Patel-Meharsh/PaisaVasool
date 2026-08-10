const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

// Authentication
const protect = require("../middleware/authMiddleware");

// Authorization
const authorize = require("../middleware/roleMiddleware");


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


// ============================================================
// PUBLIC PRODUCT ROUTES
// ============================================================

// Anyone can view products.

// GET /api/products
router.get("/", getProducts);

// GET /api/products/:id
router.get("/:id", getProductById);


// ============================================================
// ADMIN PRODUCT ROUTES
// ============================================================

// Only admins can create products.

// POST /api/products
router.post(
    "/",
    protect,
    authorize("admin"),
    createProduct
);


// Only admins can update products.

// PUT /api/products/:id
router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateProduct
);


// Only admins can delete products.

// DELETE /api/products/:id
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteProduct
);


// Export router
module.exports = router;