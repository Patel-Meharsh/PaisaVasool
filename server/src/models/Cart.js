// Import mongoose
const mongoose = require("mongoose");
// ============================================================
// CART ITEM SCHEMA
// ============================================================
const cartItemSchema = new mongoose.Schema(
    {
        // Product being added to the cart
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        // Quantity of this product
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: false
    }
);
// ============================================================
// CART SCHEMA
// ============================================================
const cartSchema = new mongoose.Schema(
    {
        // Each cart belongs to one user
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        // Products inside the cart
        items: {
            type: [cartItemSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);
// ============================================================
// CREATE MODEL
// ============================================================
const Cart = mongoose.model("Cart", cartSchema);
// Export model
module.exports = Cart;