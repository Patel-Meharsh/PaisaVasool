const mongoose = require("mongoose");

// Import Cart model
const Cart = require("../models/Cart");

// Import Product model
const Product = require("../models/Product");


// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (value) =>
    mongoose.Types.ObjectId.isValid(value);


// ============================================================
// GET CART
// ============================================================

const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({
            user: req.user._id
        }).populate(
            "items.product",
            "name price stock images brand"
        );

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: []
            });
        }

        res.status(200).json({
            message: "Cart fetched successfully",
            cart
        });

    } catch (error) {
        console.error(
            "Get cart error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ADD PRODUCT TO CART
// ============================================================

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity === undefined) {
            return res.status(400).json({
                message: "Product ID and quantity are required"
            });
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be a positive integer"
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        let cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: [
                    {
                        product: productId,
                        quantity
                    }
                ]
            });

        } else {
            const existingItem = cart.items.find(
                item =>
                    item.product.toString() === productId
            );

            if (existingItem) {
                const newQuantity =
                    existingItem.quantity + quantity;

                if (newQuantity > product.stock) {
                    return res.status(400).json({
                        message:
                            "Requested quantity exceeds available stock"
                    });
                }

                existingItem.quantity = newQuantity;

            } else {
                cart.items.push({
                    product: productId,
                    quantity
                });
            }

            await cart.save();
        }

        cart = await Cart.findOne({
            user: req.user._id
        }).populate(
            "items.product",
            "name price stock images brand"
        );

        res.status(200).json({
            message: "Product added to cart",
            cart
        });

    } catch (error) {
        console.error(
            "Add to cart error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// UPDATE CART ITEM
// ============================================================

const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity === undefined) {
            return res.status(400).json({
                message: "Product ID and quantity are required"
            });
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({
                message: "Quantity must be a non-negative integer"
            });
        }

        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            item =>
                item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                message: "Product is not in cart"
            });
        }

        // Quantity 0 removes the product.
        if (quantity === 0) {
            cart.items = cart.items.filter(
                item =>
                    item.product.toString() !== productId
            );

        } else {
            const product = await Product.findOne({
                _id: productId,
                isActive: true
            });

            if (!product) {
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            if (quantity > product.stock) {
                return res.status(400).json({
                    message:
                        "Requested quantity exceeds available stock"
                });
            }

            item.quantity = quantity;
        }

        await cart.save();

        const updatedCart = await Cart.findOne({
            user: req.user._id
        }).populate(
            "items.product",
            "name price stock images brand"
        );

        res.status(200).json({
            message: "Cart updated successfully",
            cart: updatedCart
        });

    } catch (error) {
        console.error(
            "Update cart error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// REMOVE PRODUCT FROM CART
// ============================================================

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const hadItem = cart.items.some(
            item =>
                item.product.toString() === productId
        );

        if (!hadItem) {
            return res.status(404).json({
                message: "Product is not in cart"
            });
        }

        cart.items = cart.items.filter(
            item =>
                item.product.toString() !== productId
        );

        await cart.save();

        const updatedCart = await Cart.findOne({
            user: req.user._id
        }).populate(
            "items.product",
            "name price stock images brand"
        );

        res.status(200).json({
            message: "Product removed from cart",
            cart: updatedCart
        });

    } catch (error) {
        console.error(
            "Remove from cart error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// CLEAR CART
// ============================================================

const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            message: "Cart cleared successfully",
            cart
        });

    } catch (error) {
        console.error(
            "Clear cart error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
