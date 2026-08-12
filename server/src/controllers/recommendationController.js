// ============================================================
// IMPORT MODELS
// ============================================================
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
// ============================================================
// GET SMART PRODUCT RECOMMENDATIONS
// ============================================================
// GET /api/products/recommendations
// Recommendation logic:
// 1. Check user's previous orders.
// 2. Check products currently in the user's cart.
// 3. Find categories related to those products.
// 4. Find active products from those categories.
// 5. Exclude products already purchased.
// 6. Exclude products already in the cart.
// 7. Return recommended products.
// This is a rule-based recommendation system.
// No external AI service is required.
const getRecommendations = async (req, res) => {
    try {
        // ----------------------------------------------------
        // 1. Find user's previous orders
        // ----------------------------------------------------
        const orders = await Order.find({
            user: req.user._id
        }).select("items.product");
        // ----------------------------------------------------
        // 2. Find user's current cart
        // ----------------------------------------------------
        const cart = await Cart.findOne({
            user: req.user._id
        }).select("items.product");
        // ----------------------------------------------------
        // 3. Collect purchased product IDs
        // ----------------------------------------------------
        const purchasedProductIds = new Set();
        for (const order of orders) {
            for (const item of order.items) {
                if (item.product) {
                    purchasedProductIds.add(
                        item.product.toString()
                    );
                }
            }
        }
        // ----------------------------------------------------
        // 4. Collect cart product IDs
        // ----------------------------------------------------
        const cartProductIds = new Set();
        if (cart) {
            for (const item of cart.items) {
                if (item.product) {
                    cartProductIds.add(
                        item.product.toString()
                    );
                }
            }
        }
        // ----------------------------------------------------
        // 5. Combine purchased + cart product IDs
        // ----------------------------------------------------
        const relatedProductIds = [
            ...purchasedProductIds,
            ...cartProductIds
        ];
        // ----------------------------------------------------
        // 6. Find the products that generated the user's
        //    interests.
        //    We need their category IDs.
        // ----------------------------------------------------
        let categoryIds = [];
        if (relatedProductIds.length > 0) {
            const relatedProducts =
                await Product.find({
                    _id: {
                        $in: relatedProductIds
                    }
                }).select("category");
            categoryIds = relatedProducts
                .filter(product => product.category)
                .map(product =>
                    product.category
                );
        }
        // ----------------------------------------------------
        // 7. Find recommended products
        // ----------------------------------------------------
        let recommendations = [];
        if (categoryIds.length > 0) {
            recommendations =
                await Product.find({
                    // Product must be active
                    isActive: true,
                    // Product must belong to a category
                    // related to user's interests
                    category: {
                        $in: categoryIds
                    },
                    // Do not recommend products already purchased
                    _id: {
                        $nin: relatedProductIds
                    }
                })
                // Show useful product information
                .select(
                    "name description price stock images brand category"
                )
                // Newer products first
                .sort({
                    createdAt: -1
                })
                // Keep the recommendation list small
                .limit(10);
        }
        // ----------------------------------------------------
        // 8. Fallback
        // ----------------------------------------------------
        // If the user has no purchase/cart history,
        // show some active products instead.
        // This makes the recommendation API useful for
        // new users as well.
        if (recommendations.length === 0) {
            recommendations =
                await Product.find({
                    isActive: true
                })
                .select(
                    "name description price stock images brand category"
                )
                .sort({
                    createdAt: -1
                })
                .limit(10);
        }
        // ----------------------------------------------------
        // 9. Send response
        // ----------------------------------------------------
        res.status(200).json({
            message:
                "Smart recommendations fetched successfully",

            recommendations
        });
    } catch (error) {
        // ----------------------------------------------------
        // Error handling
        // ----------------------------------------------------
        console.error(
            "Get recommendations error:",
            error.message
        );
        res.status(500).json({
            message:
                "Server error"

        });
    }
};
// ============================================================
// EXPORT
// ============================================================
module.exports = {
    getRecommendations
};