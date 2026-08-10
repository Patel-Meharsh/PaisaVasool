// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// PRODUCT SCHEMA
// ============================================================

const productSchema = new mongoose.Schema(
    {

        // ----------------------------------------------------
        // Product name
        // ----------------------------------------------------

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ----------------------------------------------------
        // Product description
        // ----------------------------------------------------

        description: {
            type: String,
            required: true,
            trim: true
        },


        // ----------------------------------------------------
        // Product price
        // ----------------------------------------------------

        price: {
            type: Number,
            required: true,
            min: 0
        },


        // ----------------------------------------------------
        // Available stock
        // ----------------------------------------------------

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },


        // ----------------------------------------------------
        // Product images
        // ----------------------------------------------------

        // For now we will store image URLs.
        // Later we can integrate Cloudinary or another
        // image storage service.

        images: {
            type: [String],
            default: []
        },


        // ----------------------------------------------------
        // Brand
        // ----------------------------------------------------

        brand: {
            type: String,
            trim: true,
            default: ""
        },


        // ----------------------------------------------------
        // Category
        // ----------------------------------------------------

        // Each product belongs to one category.
        //
        // Example:
        //
        // Product → Electronics
        //
        // The category field stores the Category document's
        // ObjectId.

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },


        // ----------------------------------------------------
        // Product active status
        // ----------------------------------------------------

        isActive: {
            type: Boolean,
            default: true
        }

    },

    {
        // Automatically creates:
        //
        // createdAt
        // updatedAt

        timestamps: true
    }
);


// ============================================================
// CREATE MODEL
// ============================================================

const Product = mongoose.model(
    "Product",
    productSchema
);


// Export model
module.exports = Product;