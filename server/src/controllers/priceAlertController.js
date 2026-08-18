const mongoose = require("mongoose");

// Import models
const PriceAlert = require("../models/PriceAlert");
const Product = require("../models/Product");


// ============================================================
// CREATE PRICE ALERT
// ============================================================

const createPriceAlert = async (req, res) => {
    try {
        const { productId, targetPrice } = req.body;

        if (!productId || targetPrice === undefined) {
            return res.status(400).json({
                message:
                    "Product ID and target price are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        if (
            typeof targetPrice !== "number" ||
            !Number.isFinite(targetPrice) ||
            targetPrice < 0
        ) {
            return res.status(400).json({
                message:
                    "Target price must be a valid non-negative number"
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (product.price <= targetPrice) {
            return res.status(400).json({
                message:
                    "Product price is already at or below your target price"
            });
        }

        const existingAlert = await PriceAlert.findOne({
            user: req.user._id,
            product: productId,
            isNotified: false
        });

        if (existingAlert) {
            return res.status(400).json({
                message:
                    "You already have a price alert for this product"
            });
        }

        try {
            const priceAlert = await PriceAlert.create({
                user: req.user._id,
                product: product._id,
                targetPrice,
                currentPrice: product.price
            });

            return res.status(201).json({
                message:
                    "Price alert created successfully",
                priceAlert
            });

        } catch (error) {
            // The database unique index closes the race window
            // between the findOne check and create operation.
            if (error.code === 11000) {
                return res.status(409).json({
                    message:
                        "You already have a price alert for this product"
                });
            }

            throw error;
        }

    } catch (error) {
        console.error(
            "Create price alert error:",
            error.message
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET MY PRICE ALERTS
// ============================================================

const getMyPriceAlerts = async (req, res) => {
    try {
        const priceAlerts = await PriceAlert.find({
            user: req.user._id
        })
            .populate(
                "product",
                "name price images stock"
            )
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            message:
                "Price alerts fetched successfully",
            priceAlerts
        });

    } catch (error) {
        console.error(
            "Get price alerts error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// DELETE PRICE ALERT
// ============================================================

const deletePriceAlert = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid price alert ID"
            });
        }

        const priceAlert = await PriceAlert.findOne({
            _id: id,
            user: req.user._id
        });

        if (!priceAlert) {
            return res.status(404).json({
                message: "Price alert not found"
            });
        }

        await PriceAlert.findByIdAndDelete(id);

        res.status(200).json({
            message:
                "Price alert deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete price alert error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createPriceAlert,
    getMyPriceAlerts,
    deletePriceAlert
};
