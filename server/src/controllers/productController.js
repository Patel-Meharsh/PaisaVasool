// Import Product model
const Product = require("../models/Product");

// Import Category model
const Category = require("../models/Category");

// Import PriceAlert model
const PriceAlert = require("../models/PriceAlert");

// Import price drop email function
const {
    sendPriceDropAlertEmail
} = require("../utils/sendEmail");


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
                message:
                    "Invalid or inactive category"
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

            message:
                "Product created successfully",

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
        // Search
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
        // Category filter
        // ----------------------------------------------------

        if (category) {

            filter.category = category;

        }


        // ----------------------------------------------------
        // Minimum price
        // ----------------------------------------------------

        if (minPrice !== undefined) {

            filter.price = {

                ...filter.price,

                $gte: Number(minPrice)

            };

        }


        // ----------------------------------------------------
        // Maximum price
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
        // Count products
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
        // Pagination information
        // ----------------------------------------------------

        const totalPages =
            Math.ceil(
                totalProducts / limitNumber
            );


        // ----------------------------------------------------
        // Response
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


        const product = await Product.findOne({

            _id: id,
            isActive: true

        }).populate(

            "category",
            "name description"

        );


        if (!product) {

            return res.status(404).json({
                message:
                    "Product not found"
            });

        }


        res.status(200).json({

            message:
                "Product fetched successfully",

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
        // Find existing product first
        // ----------------------------------------------------

        const existingProduct =
            await Product.findById(id);


        if (!existingProduct) {

            return res.status(404).json({

                message:
                    "Product not found"

            });

        }


        // ----------------------------------------------------
        // Check category if changed
        // ----------------------------------------------------

        if (category) {

            const existingCategory =
                await Category.findOne({

                    _id: category,
                    isActive: true

                });


            if (!existingCategory) {

                return res.status(400).json({

                    message:
                        "Invalid or inactive category"

                });

            }

        }


        // ----------------------------------------------------
        // Store old price
        // ----------------------------------------------------

        const oldPrice =
            existingProduct.price;


        // ----------------------------------------------------
        // Update product
        // ----------------------------------------------------

        const product =
            await Product.findByIdAndUpdate(

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


        // ====================================================
        // PRICE DROP ALERT LOGIC
        // ====================================================

        // Only run this logic when:
        //
        // 1. A new price was provided
        // 2. The new price is lower than the old price
        //
        // Example:
        //
        // Old price = ₹5000
        // New price = ₹4000
        //
        // This is a price drop.

        if (
            price !== undefined &&
            Number(price) < Number(oldPrice)
        ) {

            const newPrice =
                Number(price);


            console.log(
                `Price dropped for product ${product._id}: ₹${oldPrice} → ₹${newPrice}`
            );


            // ------------------------------------------------
            // Find active price alerts
            // ------------------------------------------------

            const alerts =
                await PriceAlert.find({

                    product: product._id,

                    isNotified: false

                }).populate(

                    "user",
                    "name email"

                );


            // ------------------------------------------------
            // Check each alert
            // ------------------------------------------------

            for (const alert of alerts) {

                // Update current product price
                alert.currentPrice =
                    newPrice;


                // ------------------------------------------------
                // Check whether target price is reached
                // ------------------------------------------------

                if (
                    newPrice <=
                    alert.targetPrice
                ) {

                    // ----------------------------------------
                    // Send price-drop email
                    // ----------------------------------------

                    try {

                        await sendPriceDropAlertEmail(

                            alert.user.email,

                            alert.user.name,

                            product,

                            alert.targetPrice

                        );


                        // ------------------------------------
                        // Mark alert as notified
                        // ------------------------------------

                        alert.isNotified = true;


                        console.log(

                            `Price alert email sent to ${alert.user.email}`

                        );

                    } catch (emailError) {

                        console.error(

                            "Price alert email error:",

                            emailError.message

                        );

                    }

                }


                await alert.save();

            }

        }


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Product updated successfully",

            product

        });

    } catch (error) {

        console.error(

            "Update product error:",

            error.message

        );

        res.status(500).json({

            message:
                "Server error"

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

        const product =
            await Product.findByIdAndUpdate(

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

                message:
                    "Product not found"

            });

        }


        res.status(200).json({

            message:
                "Product deleted successfully"

        });

    } catch (error) {

        console.error(

            "Delete product error:",

            error.message

        );

        res.status(500).json({

            message:
                "Server error"

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