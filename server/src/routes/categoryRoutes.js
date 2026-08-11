const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

// Authentication middleware
const protect = require("../middleware/authMiddleware");

// Authorization middleware
const authorize = require("../middleware/roleMiddleware");


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {createCategory,getCategories, getCategoryById, updateCategory, deleteCategory} = require("../controllers/categoryController");

const validate = require("../validators/validationMiddleware");

const {categorySchema} = require("../validators/categoryValidator");


// ============================================================
// PUBLIC ROUTES
// ============================================================

// Anyone can view active categories.

// GET /api/categories
router.get("/", getCategories);

// GET /api/categories/:id
router.get("/:id", getCategoryById);


// ============================================================
// ADMIN ROUTES
// ============================================================

// Only authenticated admins can create categories.

// POST /api/categories
router.post(
    "/",
    protect,
    authorize("admin"),
    createCategory,
    validate(categorySchema)
);


// Only authenticated admins can update categories.

// PUT /api/categories/:id
router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateCategory,
    validate(categorySchema)
);


// Only authenticated admins can delete categories.

// DELETE /api/categories/:id
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteCategory
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;