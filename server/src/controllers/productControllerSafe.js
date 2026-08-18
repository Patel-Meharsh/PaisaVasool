const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const PriceAlert = require("../models/PriceAlert");

const { sendPriceDropAlertEmail } = require("../utils/sendEmail");

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
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 10
        } = req.query;

        const filter = { isActive: true };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } }
            ];
        }

        if (category) filter.category = category;

        if (minPrice !== undefined) {
            filter.price = {
                ...filter.price,
                $gte: Number(minPrice)
            };
        }

        if (maxPrice !== undefined) {
            filter.price = {
                ...filter.price,
                $lte: Number(maxPrice)
            };
        }

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.min(
            Math.max(Number(limit), 1),
            50
        );

        const sortOption = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 }
        }[sort] || { createdAt: -1 };

        const totalProducts = await Product.countDocuments(filter);

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
            .limit(limitNumber);

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
