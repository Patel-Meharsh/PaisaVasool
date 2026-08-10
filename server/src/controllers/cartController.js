// Import Cart model
const Cart = require("../models/Cart");

// Import Product model
const Product = require("../models/Product");


// ============================================================
// GET CART
// ============================================================

const getCart = async (req, res) => {
    try {

        // Find the cart belonging to the logged-in user
        let cart = await Cart.findOne({
            user: req.user._id
        }).populate(
            "items.product",
            "name price stock images brand"
        );


        // ----------------------------------------------------
        // If user doesn't have a cart yet, create an empty one
        // ----------------------------------------------------

        if (!cart) {

            cart = await Cart.create({
                user: req.user._id,
                items: []
            });

            // Populate isn't automatically applied to the newly
            // created document, but the cart is empty anyway.
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


        // ----------------------------------------------------
        // Validate input
        // ----------------------------------------------------

        if (!productId || !quantity) {
            return res.status(400).json({
                message: "Product ID and quantity are required"
            });
        }


        if (quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }


        // ----------------------------------------------------
        // Find product
        // ----------------------------------------------------

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });


        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }


        // ----------------------------------------------------
        // Check stock
        // ----------------------------------------------------

        if (product.stock < quantity) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }


        // ----------------------------------------------------
        // Find or create user's cart
        // ----------------------------------------------------

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

            // Check whether product is already in cart
            const existingItem = cart.items.find(
                item =>
                    item.product.toString() === productId
            );


            if (existingItem) {

                // Increase existing quantity
                const newQuantity =
                    existingItem.quantity + quantity;


                // Make sure combined quantity doesn't
                // exceed available stock.
                if (newQuantity > product.stock) {
                    return res.status(400).json({
                        message: "Requested quantity exceeds available stock"
                    });
                }


                existingItem.quantity = newQuantity;

            } else {

                // Add new product
                cart.items.push({
                    product: productId,
                    quantity
                });
            }


            await cart.save();
        }


        // Fetch updated cart with product details
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


        // Find product
        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });


        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }


        // Check stock
        if (quantity > product.stock) {
            return res.status(400).json({
                message: "Requested quantity exceeds available stock"
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


        // Quantity of 0 means remove the product
        if (quantity === 0) {

            cart.items = cart.items.filter(
                item =>
                    item.product.toString() !== productId
            );

        } else {

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


        const cart = await Cart.findOne({
            user: req.user._id
        });


        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }


        // Remove product
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


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};