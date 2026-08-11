const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

// Authentication
const protect = require("../middleware/authMiddleware");

// Authorization
const authorize = require("../middleware/roleMiddleware");

const validate = require("../validators/validationMiddleware");

const {createProductSchema, updateProductSchema} = require("../validators/productValidator");


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
// Only admins can create products.
router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createProductSchema),
    createProduct
);


// PUT /api/products/:id
// Only admins can update products.
router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(updateProductSchema),
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