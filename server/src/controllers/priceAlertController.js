// Import models
const PriceAlert = require("../models/PriceAlert");
const Product = require("../models/Product");

// ============================================================
// CREATE PRICE ALERT
// ============================================================

// POST /api/price-alerts

const createPriceAlert = async (req, res) => {
    try {

        const { productId, targetPrice } = req.body;


        // ----------------------------------------------------
        // 1. Validate input
        // ----------------------------------------------------

        if (!productId || targetPrice === undefined) {

            return res.status(400).json({
                message:
                    "Product ID and target price are required"
            });

        }


        // ----------------------------------------------------
        // 2. Validate target price
        // ----------------------------------------------------

        if (
            typeof targetPrice !== "number" ||
            targetPrice < 0
        ) {

            return res.status(400).json({
                message:
                    "Target price must be a valid positive number"
            });

        }


        // ----------------------------------------------------
        // 3. Find product
        // ----------------------------------------------------

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });


        if (!product) {

            return res.status(404).json({
                message: "Product not found"
            });

        }


        // ----------------------------------------------------
        // 4. Check whether target price is already reached
        // ----------------------------------------------------

        if (product.price <= targetPrice) {

            return res.status(400).json({
                message:
                    "Product price is already at or below your target price"
            });

        }


        // ----------------------------------------------------
        // 5. Check for existing active alert
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // 6. Create price alert
        // ----------------------------------------------------

        const priceAlert = await PriceAlert.create({

            user: req.user._id,

            product: product._id,

            targetPrice,

            currentPrice: product.price

        });


        // ----------------------------------------------------
        // 7. Response
        // ----------------------------------------------------

        res.status(201).json({

            message:
                "Price alert created successfully",

            priceAlert

        });

    } catch (error) {

        console.error(
            "Create price alert error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ============================================================
// GET MY PRICE ALERTS
// ============================================================

// GET /api/price-alerts

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

// DELETE /api/price-alerts/:id

const deletePriceAlert = async (req, res) => {
    try {

        const { id } = req.params;


        // ----------------------------------------------------
        // Find only user's own alert
        // ----------------------------------------------------

        const priceAlert = await PriceAlert.findOne({

            _id: id,

            user: req.user._id

        });


        if (!priceAlert) {

            return res.status(404).json({
                message: "Price alert not found"
            });

        }


        // ----------------------------------------------------
        // Delete alert
        // ----------------------------------------------------

        await PriceAlert.findByIdAndDelete(id);


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

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


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    createPriceAlert,

    getMyPriceAlerts,

    deletePriceAlert

};