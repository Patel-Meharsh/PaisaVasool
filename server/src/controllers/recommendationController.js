// ============================================================
// IMPORT MODELS
// ============================================================

const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

// ============================================================
// GET SMART PRODUCT RECOMMENDATIONS
// ============================================================

const getRecommendations = async (req, res) => {
    try {
        // ----------------------------------------------------
        // 1. Read only the product references we need.
        // ----------------------------------------------------
        const [orders, cart] = await Promise.all([
            Order.find({ user: req.user._id })
                .select("items.product")
                .lean(),
            Cart.findOne({ user: req.user._id })
                .select("items.product")
                .lean()
        ]);

        // ----------------------------------------------------
        // 2. Collect purchased and cart product IDs.
        // ----------------------------------------------------
        const purchasedProductIds = new Set();
        const cartProductIds = new Set();

        for (const order of orders) {
            for (const item of order.items || []) {
                if (item.product) {
                    purchasedProductIds.add(
                        item.product.toString()
                    );
                }
            }
        }

        for (const item of cart?.items || []) {
            if (item.product) {
                cartProductIds.add(
                    item.product.toString()
                );
            }
        }

        const relatedProductIds = [
            ...new Set([
                ...purchasedProductIds,
                ...cartProductIds
            ])
        ];

        // ----------------------------------------------------
        // 3. Determine the user's interested categories.
        // ----------------------------------------------------
        let categoryIds = [];

        if (relatedProductIds.length > 0) {
            const relatedProducts = await Product.find({
                _id: { $in: relatedProductIds }
            })
                .select("category")
                .lean();

            categoryIds = [
                ...new Set(
                    relatedProducts
                        .filter(product => product.category)
                        .map(product => product.category.toString())
                )
            ];
        }

        // ----------------------------------------------------
        // 4. Find recommendations.
        // ----------------------------------------------------
        const projection =
            "name description price stock images brand category subcategory";

        let recommendations = [];

        if (categoryIds.length > 0) {
            recommendations = await Product.find({
                isActive: true,
                category: { $in: categoryIds },
                _id: { $nin: relatedProductIds }
            })
                .select(projection)
                .populate("category", "name")
                .sort({ createdAt: -1, _id: -1 })
                .limit(10)
                .lean();
        }

        // ----------------------------------------------------
        // 5. Fallback for new users.
        // ----------------------------------------------------
        if (recommendations.length === 0) {
            recommendations = await Product.find({
                isActive: true
            })
                .select(projection)
                .populate("category", "name")
                .sort({ createdAt: -1, _id: -1 })
                .limit(10)
                .lean();
        }

        return res.status(200).json({
            message:
                "Smart recommendations fetched successfully",
            recommendations
        });
    } catch (error) {
        console.error(
            "Get recommendations error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getRecommendations
};