// Import the Category model
// Used to create, read, update and delete categories.
const Category = require("../models/Category");


// ============================================================
// CREATE CATEGORY
// ============================================================

// Create a new category
const createCategory = async (req, res) => {
    try {

        // Get category information from request body
        const { name, description } = req.body;


        // ----------------------------------------------------
        // 1. Validate category name
        // ----------------------------------------------------

        if (!name) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }


        // ----------------------------------------------------
        // 2. Check whether category already exists
        // ----------------------------------------------------

        const existingCategory = await Category.findOne({
            name: name.trim()
        });

        if (existingCategory) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }


        // ----------------------------------------------------
        // 3. Create category
        // ----------------------------------------------------

        const category = await Category.create({
            name: name.trim(),
            description
        });


        // ----------------------------------------------------
        // 4. Send response
        // ----------------------------------------------------

        res.status(201).json({
            message: "Category created successfully",
            category
        });

    } catch (error) {

        console.error(
            "Create category error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET ALL CATEGORIES
// ============================================================

// Get all active categories
const getCategories = async (req, res) => {
    try {

        // Find all active categories
        const categories = await Category.find({
            isActive: true
        }).sort({
            name: 1
        });


        // Send categories
        res.status(200).json({
            message: "Categories fetched successfully",
            categories
        });

    } catch (error) {

        console.error(
            "Get categories error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET SINGLE CATEGORY
// ============================================================

// Get one category using its ID
const getCategoryById = async (req, res) => {
    try {

        // Get category ID from URL
        const { id } = req.params;


        // Find category
        const category = await Category.findOne({
            _id: id,
            isActive: true
        });


        // Category not found
        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }


        // Send category
        res.status(200).json({
            message: "Category fetched successfully",
            category
        });

    } catch (error) {

        console.error(
            "Get category error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// UPDATE CATEGORY
// ============================================================

// Update an existing category
const updateCategory = async (req, res) => {
    try {

        // Get category ID from URL
        const { id } = req.params;

        // Get updated information
        const { name, description, isActive } = req.body;


        // Find and update category
        const category = await Category.findByIdAndUpdate(
            id,
            {
                name,
                description,
                isActive
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );


        // Category not found
        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }


        // Send updated category
        res.status(200).json({
            message: "Category updated successfully",
            category
        });

    } catch (error) {

        console.error(
            "Update category error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// DELETE CATEGORY
// ============================================================

// Delete a category
const deleteCategory = async (req, res) => {
    try {

        // Get category ID from URL
        const { id } = req.params;


        // Find category
        const category = await Category.findById(id);


        // Category not found
        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }


        // ----------------------------------------------------
        // Soft delete
        // ----------------------------------------------------

        // Instead of permanently deleting the category,
        // mark it as inactive.
        //
        // This is safer because products may reference it.

        category.isActive = false;

        await category.save();


        // Send response
        res.status(200).json({
            message: "Category deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete category error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};