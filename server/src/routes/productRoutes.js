const express = require("express");
const router = express.Router();
// ============================================================
// IMPORT MIDDLEWARE
// ============================================================
// Authentication
const protect =
    require("../middleware/authMiddleware");
// Authorization
const authorize =
    require("../middleware/roleMiddleware");
// Validation
const validate =
    require("../validators/validationMiddleware");
const {
    createProductSchema,
    updateProductSchema
} = require("../validators/productValidator");
// ============================================================
// IMPORT PRODUCT CONTROLLERS
// ============================================================
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");
// ============================================================
// IMPORT RECOMMENDATION CONTROLLER
// ============================================================
const {
    getRecommendations
} = require("../controllers/recommendationController");
// ============================================================
// PUBLIC PRODUCT ROUTES
// ============================================================
// Anyone can view products.
// GET /api/products
router.get(
    "/",
    getProducts
);
// ============================================================
// SMART RECOMMENDATIONS
// ============================================================
// Logged-in users can get personalized recommendations.
// IMPORTANT:
// This route MUST come before /:id.
// Otherwise:
// /api/products/recommendations
// could be interpreted as:
// /api/products/:id
// GET /api/products/recommendations
router.get(
    "/recommendations",
    protect,
    getRecommendations
);
// ============================================================
// GET SINGLE PRODUCT
// ============================================================
// GET /api/products/:id
router.get(
    "/:id",
    getProductById
);
// ============================================================
// ADMIN PRODUCT ROUTES
// ============================================================
// ------------------------------------------------------------
// CREATE PRODUCT
// ------------------------------------------------------------
// Only admins can create products.
// POST /api/products
router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createProductSchema),
    createProduct
);
// ------------------------------------------------------------
// UPDATE PRODUCT
// ------------------------------------------------------------
// Only admins can update products.
// PUT /api/products/:id
router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(updateProductSchema),
    updateProduct
);
// ------------------------------------------------------------
// DELETE PRODUCT
// ------------------------------------------------------------
// Only admins can delete products.
// DELETE /api/products/:id
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteProduct
);
// ============================================================
// EXPORT ROUTER
// ============================================================
module.exports = router;