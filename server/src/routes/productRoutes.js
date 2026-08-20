const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const validate = require("../validators/validationMiddleware");
const {
    createProductSchema,
    updateProductSchema
} = require("../validators/productValidator");

const {
    createProduct,
    getProducts,
    getProductFacets,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productControllerSafe");

const {
    getRecommendations
} = require("../controllers/recommendationController");

// Public catalogue endpoints.
router.get("/", getProducts);

// Must be registered before /:id so "facets" is not treated as a product ID.
router.get("/facets", getProductFacets);

router.get(
    "/recommendations",
    protect,
    getRecommendations
);

router.get("/:id", getProductById);

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createProductSchema),
    createProduct
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteProduct
);

module.exports = router;
