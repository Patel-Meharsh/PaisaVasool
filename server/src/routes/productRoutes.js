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
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productControllerSafe");

const {
    getRecommendations
} = require("../controllers/recommendationController");

router.get("/", getProducts);

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
