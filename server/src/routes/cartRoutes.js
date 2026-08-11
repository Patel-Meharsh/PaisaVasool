const express = require("express");

const router = express.Router();


// Authentication middleware
const protect = require("../middleware/authMiddleware");


// Cart controllers
const {getCart, addToCart, updateCartItem, removeFromCart, clearCart} = require("../controllers/cartController");

const validate = require("../validators/validationMiddleware");

const {cartSchema} = require("../validators/cartValidator");


// ============================================================
// ALL CART ROUTES REQUIRE LOGIN
// ============================================================

// GET /api/cart
router.get(
    "/",
    protect,
    getCart
);


// POST /api/cart/add
router.post(
    "/add",
    protect,
    addToCart,
    validate(cartSchema)
);


// PUT /api/cart/update
router.put(
    "/update",
    protect,
    updateCartItem
);


// DELETE /api/cart/remove/:productId
router.delete(
    "/remove/:productId",
    protect,
    removeFromCart
);


// DELETE /api/cart/clear
router.delete(
    "/clear",
    protect,
    clearCart
);


// Export router
module.exports = router;