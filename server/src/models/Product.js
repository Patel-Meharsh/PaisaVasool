// Import mongoose
const mongoose = require("mongoose");

// ============================================================
// PRODUCT SCHEMA
// ============================================================

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        images: {
            type: [String],
            default: []
        },

        brand: {
            type: String,
            trim: true,
            default: ""
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        // Category-specific product type.
        // Examples: Shirts, Pants, Sneakers, Speakers, etc.
        subcategory: {
            type: String,
            trim: true,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// ============================================================
// PERFORMANCE INDEXES
// ============================================================

productSchema.index({ isActive: 1, category: 1, subcategory: 1 });
productSchema.index({ isActive: 1, category: 1, brand: 1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// Text index for scalable catalogue search.
productSchema.index({
    name: "text",
    description: "text",
    brand: "text",
    subcategory: "text"
});

// ============================================================
// CREATE MODEL
// ============================================================

const Product = mongoose.model("Product", productSchema);

module.exports = Product;