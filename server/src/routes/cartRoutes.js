const express = require("express");

const router = express.Router();


// ============================================================
// MIDDLEWARE
// ============================================================

const protect = require("../middleware/authMiddleware");
const validate = require("../validators/validationMiddleware");


// ============================================================
// CART CONTROLLERS / VALIDATION
// ============================================================

const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

const {
    cartSchema,
    updateCartSchema
} = require("../validators/cartValidator");


// ============================================================
// ALL CART ROUTES REQUIRE LOGIN
// ============================================================

router.get(
    "/",
    protect,
    getCart
);

router.post(
    "/add",
    protect,
    validate(cartSchema),
    addToCart
);

router.put(
    "/update",
    protect,
    validate(updateCartSchema),
    updateCartItem
);

router.delete(
    "/remove/:productId",
    protect,
    removeFromCart
);

router.delete(
    "/clear",
    protect,
    clearCart
);


module.exports = router;
