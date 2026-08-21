const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const PriceAlert = require("../models/PriceAlert");

const { sendPriceDropAlertEmail } = require("../utils/sendEmail");

// ============================================================
// PRICE ALERT PROCESSING
// ============================================================

const processPriceAlerts = async (productId, newPrice) => {
    const product = await Product.findById(productId).populate(
        "category",
        "name"
    );

    if (!product) return;

    const alerts = await PriceAlert.find({
        product: productId,
        isNotified: false,
        targetPrice: { $gte: newPrice }
    }).populate("user", "name email");

    for (const alert of alerts) {
        const claimed = await PriceAlert.findOneAndUpdate(
            { _id: alert._id, isNotified: false },
            {
                $set: {
                    currentPrice: newPrice,
                    isNotified: true
                }
            },
            { returnDocument: "after" }
        );

        if (!claimed) continue;

        try {
            await sendPriceDropAlertEmail(
                alert.user.email,
                alert.user.name,
                product,
                alert.targetPrice
            );
        } catch (emailError) {
            await PriceAlert.findByIdAndUpdate(
                alert._id,
                {
                    $set: {
                        currentPrice: newPrice,
                        isNotified: false
                    }
                }
            );

            console.error(
                "Price alert email error:",
                emailError.message
            );
        }
    }
};

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
            category,
            subcategory
        } = req.body;

        const existingCategory = await Category.findOne({
            _id: category,
            isActive: true
        }).lean();

        if (!existingCategory) {
            return res.status(400).json({
                message: "Invalid or inactive category"
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description: description.trim(),
            price,
            stock,
            images,
            brand: brand.trim(),
            category,
            subcategory: subcategory?.trim() || ""
        });

        return res.status(201).json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("Create product error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// ============================================================
// GET PRODUCT CATALOGUE
// ============================================================

const getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            subcategory,
            brand,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 12
        } = req.query;

        const filter = { isActive: true };

        if (search?.trim()) {
            const safeSearch = search.trim().slice(0, 100);

            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
                { brand: { $regex: safeSearch, $options: "i" } },
                { subcategory: { $regex: safeSearch, $options: "i" } }
            ];
        }

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    message: "Invalid category ID"
                });
            }

            filter.category = category;
        }

        // Brand matching is deliberately case-insensitive.
        // This means Apple, apple and APPLE all match the same brand.
        if (brand?.trim()) {
            filter.brand = {
                $regex: `^${escapeRegex(brand.trim())}$`,
                $options: "i"
            };
        }

        // Type/subcategory matching is also case-insensitive.
        if (subcategory?.trim()) {
            filter.subcategory = {
                $regex: `^${escapeRegex(subcategory.trim())}$`,
                $options: "i"
            };
        }

        const parsedMinPrice =
            minPrice !== undefined ? Number(minPrice) : null;

        const parsedMaxPrice =
            maxPrice !== undefined ? Number(maxPrice) : null;

        if (
            minPrice !== undefined &&
            (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)
        ) {
            return res.status(400).json({
                message: "Invalid minimum price"
            });
        }

        if (
            maxPrice !== undefined &&
            (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0)
        ) {
            return res.status(400).json({
                message: "Invalid maximum price"
            });
        }

        if (
            parsedMinPrice !== null &&
            parsedMaxPrice !== null &&
            parsedMinPrice > parsedMaxPrice
        ) {
            return res.status(400).json({
                message: "Minimum price cannot be greater than maximum price"
            });
        }

        if (parsedMinPrice !== null || parsedMaxPrice !== null) {
            filter.price = {};

            if (parsedMinPrice !== null) {
                filter.price.$gte = parsedMinPrice;
            }

            if (parsedMaxPrice !== null) {
                filter.price.$lte = parsedMaxPrice;
            }
        }

        const pageNumber = Math.max(
            Number.parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(Number.parseInt(limit, 10) || 12, 1),
            50
        );

        const projection = {
            name: 1,
            description: 1,
            price: 1,
            stock: 1,
            images: 1,
            brand: 1,
            category: 1,
            subcategory: 1
        };

        const skip = (pageNumber - 1) * limitNumber;

        const sortOption = {
            price_asc: { price: 1, _id: 1 },
            price_desc: { price: -1, _id: 1 },
            name_asc: { name: 1, _id: 1 },
            name_desc: { name: -1, _id: 1 }
        }[sort];

        const totalProducts = await Product.countDocuments(filter);

        let products;

        if (sortOption) {
            // Explicit user-selected sorting takes priority over the
            // catalogue grouping order.
            products = await Product.find(filter, projection)
                .populate("category", "name")
                .sort(sortOption)
                .skip(skip)
                .limit(limitNumber)
                .lean();
        } else {
            // Default catalogue order:
            //
            // Clothing
            //   Pants -> Shirts -> T-Shirts -> Tops
            //
            // Electronics
            //   Smartphones -> Televisions -> Air Conditioners
            //   -> Headphones -> Speakers
            //
            // We calculate these keys in MongoDB so pagination happens
            // after the deterministic ordering instead of sorting the
            // entire result set in JavaScript.
            const pipeline = [
                { $match: filter },

                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    description: 1
                                }
                            }
                        ],
                        as: "categoryData"
                    }
                },

                {
                    $unwind: {
                        path: "$categoryData",
                        preserveNullAndEmptyArrays: true
                    }
                },

                {
                    $addFields: {
                        catalogueCategoryOrder: {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$categoryData.name",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "clothing"
                                            ]
                                        },
                                        then: 1
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$categoryData.name",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "electronics"
                                            ]
                                        },
                                        then: 2
                                    }
                                ],
                                default: 99
                            }
                        },
                        catalogueTypeOrder: {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "pants"
                                            ]
                                        },
                                        then: 1
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "shirts"
                                            ]
                                        },
                                        then: 2
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "t-shirts"
                                            ]
                                        },
                                        then: 3
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "tops"
                                            ]
                                        },
                                        then: 4
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "smartphones"
                                            ]
                                        },
                                        then: 1
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "televisions"
                                            ]
                                        },
                                        then: 2
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "air conditioners"
                                            ]
                                        },
                                        then: 3
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "headphones"
                                            ]
                                        },
                                        then: 4
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                {
                                                    $toLower: {
                                                        $ifNull: [
                                                            "$subcategory",
                                                            ""
                                                        ]
                                                    }
                                                },
                                                "speakers"
                                            ]
                                        },
                                        then: 5
                                    }
                                ],
                                default: 99
                            }
                        }
                    }
                },

                {
                    $sort: {
                        catalogueCategoryOrder: 1,
                        catalogueTypeOrder: 1,
                        name: 1,
                        _id: 1
                    }
                },

                { $skip: skip },
                { $limit: limitNumber },

                {
                    $project: {
                        ...projection,
                        category: {
                            _id: "$categoryData._id",
                            name: "$categoryData.name",
                            description: "$categoryData.description"
                        }
                    }
                }
            ];

            products = await Product.aggregate(pipeline).allowDiskUse(true);
        }

        const totalPages = Math.ceil(
            totalProducts / limitNumber
        );

        return res.status(200).json({
            message: "Products fetched successfully",
            products,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalProducts,
                limit: limitNumber,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1
            }
        });
    } catch (error) {
        console.error("Get products error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// ============================================================
// GET PRODUCT FILTER FACETS
// ============================================================

const getProductFacets = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isActive: true };

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    message: "Invalid category ID"
                });
            }

            filter.category = category;
        }

        const [subcategories, brands] = await Promise.all([
            Product.distinct("subcategory", filter),
            Product.distinct("brand", filter)
        ]);

        return res.status(200).json({
            message: "Product filters fetched successfully",
            subcategories: subcategories
                .filter(Boolean)
                .map(value => value.trim())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b)),
            brands: brands
                .filter(Boolean)
                .map(value => value.trim())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b))
        });
    } catch (error) {
        console.error("Get product facets error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// ============================================================
// GET PRODUCT BY ID
// ============================================================

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const product = await Product.findOne({
            _id: id,
            isActive: true
        })
            .populate("category", "name description")
            .lean();

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            product
        });
    } catch (error) {
        console.error("Get product error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// ============================================================
// UPDATE PRODUCT
// ============================================================

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const updates = {};
        const allowedFields = [
            "name",
            "description",
            "price",
            "stock",
            "images",
            "brand",
            "category",
            "subcategory",
            "isActive"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.name !== undefined) {
            updates.name = updates.name.trim();
        }

        if (updates.description !== undefined) {
            updates.description = updates.description.trim();
        }

        if (updates.brand !== undefined) {
            updates.brand = updates.brand.trim();
        }

        if (updates.subcategory !== undefined) {
            updates.subcategory = updates.subcategory.trim();
        }

        if (updates.category !== undefined) {
            const existingCategory = await Category.findOne({
                _id: updates.category,
                isActive: true
            }).lean();

            if (!existingCategory) {
                return res.status(400).json({
                    message: "Invalid or inactive category"
                });
            }
        }

        const oldPrice = existingProduct.price;

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        )
            .populate("category", "name description")
            .lean();

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (
            updates.price !== undefined &&
            Number(updates.price) < Number(oldPrice)
        ) {
            setImmediate(() => {
                processPriceAlerts(
                    product._id,
                    Number(updates.price)
                ).catch(error => {
                    console.error(
                        "Background price alert processing error:",
                        error.message
                    );
                });
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error("Update product error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// ============================================================
// DELETE PRODUCT
// ============================================================

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { returnDocument: "after" }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
    createProduct,
    getProducts,
    getProductFacets,
    getProductById,
    updateProduct,
    deleteProduct
};
