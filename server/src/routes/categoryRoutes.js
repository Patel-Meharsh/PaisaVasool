const express = require("express");

const router = express.Router();


// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const validate = require("../validators/validationMiddleware");


// ============================================================
// IMPORT CONTROLLERS
// ============================================================

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const { categorySchema } = require("../validators/categoryValidator");


// ============================================================
// PUBLIC ROUTES
// ============================================================

router.get(
    "/",
    getCategories
);

router.get(
    "/:id",
    getCategoryById
);


// ============================================================
// ADMIN ROUTES
// ============================================================

// Validation MUST run before the controller so invalid input
// never reaches the database layer.
router.post(
    "/",
    protect,
    authorize("admin"),
    validate(categorySchema),
    createCategory
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(categorySchema),
    updateCategory
);

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
