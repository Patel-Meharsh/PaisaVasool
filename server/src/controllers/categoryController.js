const Category = require("../models/Category");

// ============================================================
// CREATE CATEGORY
// ============================================================

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }

        const normalizedName = name.trim();

        const existingCategory = await Category.findOne({
            name: normalizedName
        }).lean();

        if (existingCategory) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name: normalizedName,
            description: description?.trim() || ""
        });

        return res.status(201).json({
            message: "Category created successfully",
            category
        });
    } catch (error) {
        console.error(
            "Create category error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// GET ALL ACTIVE CATEGORIES
// ============================================================

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find(
            { isActive: true },
            { name: 1, description: 1 }
        )
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({
            message: "Categories fetched successfully",
            categories
        });
    } catch (error) {
        console.error(
            "Get categories error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// GET SINGLE CATEGORY
// ============================================================

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findOne({
            _id: id,
            isActive: true
        }).lean();

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        return res.status(200).json({
            message: "Category fetched successfully",
            category
        });
    } catch (error) {
        console.error(
            "Get category error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// UPDATE CATEGORY
// ============================================================

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const updates = {};

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    message: "Category name is required"
                });
            }

            updates.name = name.trim();
        }

        if (description !== undefined) {
            updates.description = description.trim();
        }

        if (isActive !== undefined) {
            updates.isActive = isActive;
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        return res.status(200).json({
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        console.error(
            "Update category error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// DELETE CATEGORY
// ============================================================

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        category.isActive = false;
        await category.save();

        return res.status(200).json({
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete category error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};