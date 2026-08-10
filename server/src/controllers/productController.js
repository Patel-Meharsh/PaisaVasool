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
// Search + Filter + Sort + Pagination
// ============================================================

const getProducts = async (req, res) => {
    try {

        // ----------------------------------------------------
        // Read query parameters
        // ----------------------------------------------------

        const {
            search,
            category,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 10
        } = req.query;


        // ----------------------------------------------------
        // Build MongoDB filter
        // ----------------------------------------------------

        const filter = {
            isActive: true
        };


        // ----------------------------------------------------
        // Search by product name or description
        // ----------------------------------------------------

        if (search) {

            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    brand: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }


        // ----------------------------------------------------
        // Filter by category
        // ----------------------------------------------------

        if (category) {
            filter.category = category;
        }


        // ----------------------------------------------------
        // Filter by minimum price
        // ----------------------------------------------------

        if (minPrice !== undefined) {

            filter.price = {
                ...filter.price,
                $gte: Number(minPrice)
            };
        }


        // ----------------------------------------------------
        // Filter by maximum price
        // ----------------------------------------------------

        if (maxPrice !== undefined) {

            filter.price = {
                ...filter.price,
                $lte: Number(maxPrice)
            };
        }


        // ----------------------------------------------------
        // Pagination
        // ----------------------------------------------------

        const pageNumber = Math.max(
            Number(page),
            1
        );

        const limitNumber = Math.min(
            Math.max(Number(limit), 1),
            50
        );

        const skip =
            (pageNumber - 1) * limitNumber;


        // ----------------------------------------------------
        // Sorting
        // ----------------------------------------------------

        let sortOption = {
            createdAt: -1
        };


        if (sort === "price_asc") {

            sortOption = {
                price: 1
            };

        } else if (sort === "price_desc") {

            sortOption = {
                price: -1
            };

        } else if (sort === "name_asc") {

            sortOption = {
                name: 1
            };

        } else if (sort === "name_desc") {

            sortOption = {
                name: -1
            };
        }


        // ----------------------------------------------------
        // Get total number of matching products
        // ----------------------------------------------------

        const totalProducts =
            await Product.countDocuments(filter);


        // ----------------------------------------------------
        // Fetch products
        // ----------------------------------------------------

        const products =
            await Product.find(
                filter,
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
                .sort(sortOption)
                .skip(skip)
                .limit(limitNumber);


        // ----------------------------------------------------
        // Calculate pagination information
        // ----------------------------------------------------

        const totalPages =
            Math.ceil(
                totalProducts / limitNumber
            );


        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Products fetched successfully",

            products,

            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalProducts,
                limit: limitNumber,

                hasNextPage:
                    pageNumber < totalPages,

                hasPreviousPage:
                    pageNumber > 1
            }
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