const mongoose = require("mongoose");
const Product = require("../models/Product");

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CATEGORY_ORDER = {
    clothing: 1,
    electronics: 2
};

const TYPE_ORDER = {
    pants: 1,
    jeans: 1,
    trousers: 1,
    cargo: 1,
    shirts: 2,
    "t-shirts": 3,
    tshirts: 3,
    tshirt: 3,
    tops: 4,
    smartphones: 1,
    phones: 1,
    televisions: 2,
    tvs: 2,
    tv: 2,
    "air conditioners": 3,
    "air conditioner": 3,
    ac: 3,
    headphones: 4,
    headphone: 4,
    speakers: 5,
    speaker: 5
};

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
            const value = escapeRegex(search.trim().slice(0, 100));
            const regex = { $regex: value, $options: "i" };

            filter.$or = [
                { name: regex },
                { description: regex },
                { brand: regex },
                { subcategory: regex }
            ];
        }

        if (category?.trim()) {
            const categoryId = category.trim();

            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({
                    message: "Invalid category ID"
                });
            }

            // Aggregation does not perform Mongoose schema casting.
            // Convert the URL/query value to an ObjectId explicitly.
            filter.category = new mongoose.Types.ObjectId(categoryId);
        }

        if (subcategory?.trim()) {
            filter.subcategory = {
                $regex: `^${escapeRegex(subcategory.trim())}$`,
                $options: "i"
            };
        }

        if (brand?.trim()) {
            filter.brand = {
                $regex: `^${escapeRegex(brand.trim())}$`,
                $options: "i"
            };
        }

        const parsedMin = minPrice === undefined || minPrice === ""
            ? null
            : Number(minPrice);
        const parsedMax = maxPrice === undefined || maxPrice === ""
            ? null
            : Number(maxPrice);

        if (parsedMin !== null && (!Number.isFinite(parsedMin) || parsedMin < 0)) {
            return res.status(400).json({ message: "Invalid minimum price" });
        }

        if (parsedMax !== null && (!Number.isFinite(parsedMax) || parsedMax < 0)) {
            return res.status(400).json({ message: "Invalid maximum price" });
        }

        if (parsedMin !== null || parsedMax !== null) {
            filter.price = {};
            if (parsedMin !== null) filter.price.$gte = parsedMin;
            if (parsedMax !== null) filter.price.$lte = parsedMax;
        }

        if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
            return res.status(400).json({
                message: "Minimum price cannot be greater than maximum price"
            });
        }

        const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(
            Math.max(Number.parseInt(limit, 10) || 12, 1),
            50
        );
        const skip = (pageNumber - 1) * limitNumber;

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

        const totalProducts = await Product.countDocuments(filter);
        let products;

        const sortOption = {
            price_asc: { price: 1, name: 1, _id: 1 },
            price_desc: { price: -1, name: 1, _id: 1 },
            name_asc: { name: 1, _id: 1 },
            name_desc: { name: -1, _id: 1 }
        }[sort];

        if (sortOption) {
            products = await Product.find(filter, projection)
                .populate("category", "name description")
                .sort(sortOption)
                .skip(skip)
                .limit(limitNumber)
                .lean();
        } else {
            products = await Product.aggregate([
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
                        catalogueCategoryOrder: {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $eq: [
                                                { $toLower: { $ifNull: ["$categoryData.name", ""] } },
                                                "clothing"
                                            ]
                                        },
                                        then: CATEGORY_ORDER.clothing
                                    },
                                    {
                                        case: {
                                            $eq: [
                                                { $toLower: { $ifNull: ["$categoryData.name", ""] } },
                                                "electronics"
                                            ]
                                        },
                                        then: CATEGORY_ORDER.electronics
                                    }
                                ],
                                default: 99
                            }
                        },
                        catalogueTypeOrder: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(pants|jeans|trousers|cargo)$" } },
                                        then: 1
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^shirts$" } },
                                        then: 2
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(t-shirts|tshirts|tshirt)$" } },
                                        then: 3
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^tops$" } },
                                        then: 4
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(smartphones|phones)$" } },
                                        then: 1
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(televisions|tvs|tv)$" } },
                                        then: 2
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(air conditioners|air conditioner|ac)$" } },
                                        then: 3
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(headphones|headphone)$" } },
                                        then: 4
                                    },
                                    {
                                        case: { $regexMatch: { input: { $toLower: { $ifNull: ["$subcategory", ""] } }, regex: "^(speakers|speaker)$" } },
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
            ]).allowDiskUse(true);
        }

        const totalPages = Math.ceil(totalProducts / limitNumber);

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
        console.error("Get products error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getProductFacets = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isActive: true };

        if (category?.trim()) {
            const categoryId = category.trim();

            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({ message: "Invalid category ID" });
            }

            filter.category = new mongoose.Types.ObjectId(categoryId);
        }

        const [subcategories, brands] = await Promise.all([
            Product.distinct("subcategory", filter),
            Product.distinct("brand", filter)
        ]);

        return res.status(200).json({
            message: "Product filters fetched successfully",
            subcategories: [...new Set(
                subcategories
                    .filter(Boolean)
                    .map(value => value.trim())
                    .filter(Boolean)
            )].sort((a, b) => a.localeCompare(b)),
            brands: [...new Set(
                brands
                    .filter(Boolean)
                    .map(value => value.trim())
                    .filter(Boolean)
            )].sort((a, b) => a.localeCompare(b))
        });
    } catch (error) {
        console.error("Get product facets error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getProducts,
    getProductFacets
};
