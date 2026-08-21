const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const PriceAlert = require("../models/PriceAlert");

const { sendPriceDropAlertEmail } = require("../utils/sendEmail");

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TYPE_PATTERNS = {
    phone: /phone|smartphone|iphone|galaxy|pixel|vivo|oneplus|xiaomi|redmi|realme|oppo|motorola|nothing/i,
    tv: /\btv\b|television|smart tv|oled|qled/i,
    ac: /\bac\b|air conditioner|air-conditioner/i,
    headphone: /headphone|headset|earbud|earphone|airpods/i,
    speaker: /speaker|soundlink|soundbar/i,
    pant: /pant|jeans|trouser|cargo/i,
    shirt: /shirt/i,
    tshirt: /t-?shirt/i,
    top: /\btop\b/i
};

const getTypeRegex = (type) => {
    if (!type) return null;
    const normalized = type.trim().toLowerCase();
    return TYPE_PATTERNS[normalized] || new RegExp(escapeRegex(type.trim()), "i");
};

const processPriceAlerts = async (productId, newPrice) => {
    const product = await Product.findById(productId).populate(
        "category",
        "name"
    );

    if (!product) return;

    product.price = newPrice;

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

        const existingCategory = await Category.findOne({
            _id: category,
            isActive: true
        });

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
            category
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

const getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            brand,
            type,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 10
        } = req.query;

        const filter = { isActive: true };

        if (search && search.trim()) {
            const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { brand: searchRegex }
            ];
        }

        // Product.category is an ObjectId. Mongoose's find/countDocuments
        // casts string query parameters automatically, but aggregation does
        // not. Cast it explicitly so the count and returned product list use
        // the exact same filter and never disagree (e.g. 31 counted, 0 shown).
        if (category && category.trim()) {
            if (!mongoose.Types.ObjectId.isValid(category.trim())) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            filter.category = new mongoose.Types.ObjectId(category.trim());
        }

        // Brand matching is case-insensitive and exact after trimming.
        if (brand && brand.trim()) {
            filter.brand = {
                $regex: `^${escapeRegex(brand.trim())}$`,
                $options: "i"
            };
        }

        // Type is derived from the product name because the existing
        // Product schema does not store a separate type field.
        if (type && type.trim()) {
            filter.name = {
                $regex: getTypeRegex(type.trim())
            };
        }

        if (minPrice !== undefined && minPrice !== "") {
            filter.price = {
                ...filter.price,
                $gte: Number(minPrice)
            };
        }

        if (maxPrice !== undefined && maxPrice !== "") {
            filter.price = {
                ...filter.price,
                $lte: Number(maxPrice)
            };
        }

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(
            Math.max(Number(limit) || 10, 1),
            50
        );

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNumber);

        if (sort) {
            const sortOption = {
                price_asc: { price: 1, name: 1, _id: 1 },
                price_desc: { price: -1, name: 1, _id: 1 },
                name_asc: { name: 1, _id: 1 },
                name_desc: { name: -1, _id: 1 }
            }[sort];

            if (!sortOption) {
                return res.status(400).json({ message: "Invalid sort option" });
            }

            const products = await Product.find(filter, {
                name: 1,
                description: 1,
                price: 1,
                stock: 1,
                images: 1,
                brand: 1,
                category: 1
            })
                .populate("category", "name")
                .sort(sortOption)
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber)
                .lean();

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
        }

        // Default catalogue order is deterministic and type-grouped.
        // The category filter above is explicitly cast to ObjectId so the
        // aggregation matches the same documents counted above.
        const products = await Product.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
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
                    categoryName: {
                        $ifNull: ["$categoryData.name", "Other"]
                    }
                }
            },
            {
                $addFields: {
                    categoryRank: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$categoryName",
                                            regex: "^electronics$",
                                            options: "i"
                                        }
                                    },
                                    then: 1
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$categoryName",
                                            regex: "^clothing$|^clothes$|^fashion$",
                                            options: "i"
                                        }
                                    },
                                    then: 2
                                }
                            ],
                            default: 3
                        }
                    },
                    typeRank: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "phone|smartphone|iphone|galaxy|pixel|vivo|oneplus|xiaomi|redmi|realme|oppo|motorola|nothing",
                                            options: "i"
                                        }
                                    },
                                    then: 1
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "\\btv\\b|television|smart tv|oled|qled",
                                            options: "i"
                                        }
                                    },
                                    then: 2
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "\\bac\\b|air conditioner|air-conditioner",
                                            options: "i"
                                        }
                                    },
                                    then: 3
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "headphone|headset|earbud|earphone|airpods",
                                            options: "i"
                                        }
                                    },
                                    then: 4
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "speaker|soundlink|soundbar",
                                            options: "i"
                                        }
                                    },
                                    then: 5
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "pant|jeans|trouser|cargo",
                                            options: "i"
                                        }
                                    },
                                    then: 1
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "t-?shirt",
                                            options: "i"
                                        }
                                    },
                                    then: 3
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "shirt",
                                            options: "i"
                                        }
                                    },
                                    then: 2
                                },
                                {
                                    case: {
                                        $regexMatch: {
                                            input: "$name",
                                            regex: "\\btop\\b",
                                            options: "i"
                                        }
                                    },
                                    then: 4
                                }
                            ],
                            default: 99
                        }
                    }
                }
            },
            {
                $sort: {
                    categoryRank: 1,
                    typeRank: 1,
                    brand: 1,
                    name: 1,
                    _id: 1
                }
            },
            { $skip: (pageNumber - 1) * limitNumber },
            { $limit: limitNumber },
            {
                $project: {
                    name: 1,
                    description: 1,
                    price: 1,
                    stock: 1,
                    images: 1,
                    brand: 1,
                    category: {
                        _id: "$categoryData._id",
                        name: "$categoryData.name"
                    }
                }
            }
        ]);

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

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findOne({
            _id: id,
            isActive: true
        }).populate("category", "name description");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
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

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
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
            "isActive"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.name !== undefined) updates.name = updates.name.trim();
        if (updates.description !== undefined) {
            updates.description = updates.description.trim();
        }
        if (updates.brand !== undefined) updates.brand = updates.brand.trim();

        if (updates.category !== undefined) {
            const existingCategory = await Category.findOne({
                _id: updates.category,
                isActive: true
            });

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
        ).populate("category", "name description");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (
            updates.price !== undefined &&
            Number(updates.price) < Number(oldPrice)
        ) {
            setImmediate(() => {
                processPriceAlerts(product._id, Number(updates.price))
                    .catch(error => {
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

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { returnDocument: "after" }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
