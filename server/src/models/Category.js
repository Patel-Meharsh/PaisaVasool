// Import mongoose
const mongoose = require("mongoose");


// ============================================================
// CATEGORY SCHEMA
// ============================================================

const categorySchema = new mongoose.Schema(
    {

        // ----------------------------------------------------
        // Category name
        // ----------------------------------------------------

        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        // ----------------------------------------------------
        // Category description
        // ----------------------------------------------------

        description: {
            type: String,
            trim: true,
            default: ""
        },


        // ----------------------------------------------------
        // Active status
        // ----------------------------------------------------

        // Allows us to temporarily disable a category
        // without deleting it from the database.

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

const Category = mongoose.model(
    "Category",
    categorySchema
);


// Export model
module.exports = Category;