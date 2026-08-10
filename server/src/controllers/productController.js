// Import Product model
const Product = require("../models/Product");

// Import Category model
// Used to make sure the selected category actually exists.
const Category = require("../models/Category");


// ============================================================
// CREATE PRODUCT
// ============================================================

const createProduct = async (req, res) => {
    try {

        const {
            name,
            description,
            price,
            stock,
            images,
            brand,
            category
        } = req.body;


        // ----------------------------------------------------
        // 1. Validate required fields
        // ----------------------------------------------------

        if (
            !name ||
            !description ||
            price === undefined ||
            stock === undefined ||
            !category
        ) {
            return res.status(400).json({
                message:
                    "Name, description, price, stock and category are required"
            });
        }


        // ----------------------------------------------------
        // 2. Check category
        // ----------------------------------------------------

        const existingCategory = await Category.findOne({
            _id: category,
            isActive: true
        });

        if (!existingCategory) {
            return res.status(400).json({
                message: "Invalid or inactive category"
            });
        }


        // ----------------------------------------------------
        // 3. Create product
        // ----------------------------------------------------

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            images,
            brand,
            category
        });


        // ----------------------------------------------------
        // 4. Return created product
        // ----------------------------------------------------

        res.status(201).json({
            message: "Product created successfully",
            product
        });

    } catch (error) {

        console.error(
            "Create product error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET ALL PRODUCTS
// ============================================================

const getProducts = async (req, res) => {
    try {

        const products = await Product.find(
            { isActive: true },

            // Only return fields required by the frontend
            {
                name: 1,
                description: 1,
                price: 1,
                stock: 1,
                images: 1,
                brand: 1,
                category: 1
            }
        )
            .populate(
                "category",
                "name"
            )
            .sort({
                createdAt: -1
            });


        res.status(200).json({
            message: "Products fetched successfully",
            products
        });

    } catch (error) {

        console.error(
            "Get products error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET SINGLE PRODUCT
// ============================================================

const getProductById = async (req, res) => {
    try {

        const { id } = req.params;


        // Find active product and populate category.

        const product = await Product.findOne({
            _id: id,
            isActive: true
        }).populate(
            "category",
            "name description"
        );


        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }


        res.status(200).json({
            message: "Product fetched successfully",
            product
        });

    } catch (error) {

        console.error(
            "Get product error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// UPDATE PRODUCT
// ============================================================

const updateProduct = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            name,
            description,
            price,
            stock,
            images,
            brand,
            category,
            isActive
        } = req.body;


        // ----------------------------------------------------
        // If category is being changed, verify it.
        // ----------------------------------------------------

        if (category) {

            const existingCategory = await Category.findOne({
                _id: category,
                isActive: true
            });

            if (!existingCategory) {
                return res.status(400).json({
                    message: "Invalid or inactive category"
                });
            }
        }


        // ----------------------------------------------------
        // Update product
        // ----------------------------------------------------

        const product = await Product.findByIdAndUpdate(
            id,
            {
                name,
                description,
                price,
                stock,
                images,
                brand,
                category,
                isActive
            },
            {
                new: true,
                runValidators: true
            }
        ).populate(
            "category",
            "name description"
        );


        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }


        res.status(200).json({
            message: "Product updated successfully",
            product
        });

    } catch (error) {

        console.error(
            "Update product error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// DELETE PRODUCT
// ============================================================

const deleteProduct = async (req, res) => {
    try {

        const { id } = req.params;


        // ----------------------------------------------------
        // Soft delete
        // ----------------------------------------------------

        const product = await Product.findByIdAndUpdate(
            id,
            {
                isActive: false
            },
            {
                new: true
            }
        );


        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }


        res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete product error:",
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
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};