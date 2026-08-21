const Product = require("../models/Product");
const Category = require("../models/Category");

// ============================================================
// NORMALIZE PRODUCT SUBCATEGORIES
// ============================================================
// Some catalogue records were created before the subcategory field
// was standardized. We classify products from their names and write
// canonical type names so filters and catalogue grouping use one
// consistent value for every product.

const CATEGORY_RULES = {
    Electronics: [
        {
            subcategory: "Smartphones",
            pattern: /phone|smartphone|iphone|galaxy|pixel|vivo|oneplus|xiaomi|redmi|realme|oppo|motorola|nothing/i
        },
        {
            subcategory: "Televisions",
            pattern: /\btv\b|television|smart tv|oled|qled/i
        },
        {
            subcategory: "Air Conditioners",
            pattern: /\bac\b|air conditioner|air-conditioner/i
        },
        {
            subcategory: "Headphones",
            pattern: /headphone|headset|earbud|earphone|airpods/i
        },
        {
            subcategory: "Speakers",
            pattern: /speaker|soundlink|soundbar/i
        }
    ],
    Clothing: [
        {
            subcategory: "Pants",
            pattern: /pant|jeans|trouser|cargo/i
        },
        {
            subcategory: "T-Shirts",
            pattern: /t-?shirt/i
        },
        {
            subcategory: "Shirts",
            pattern: /shirt/i
        },
        {
            subcategory: "Tops",
            pattern: /\btop\b/i
        }
    ]
};

async function backfillProductSubcategories() {
    const categories = await Category.find({
        name: { $in: Object.keys(CATEGORY_RULES) },
        isActive: true
    }).select("_id name").lean();

    let updatedCount = 0;

    for (const category of categories) {
        const rules = CATEGORY_RULES[category.name] || [];

        for (const rule of rules) {
            const result = await Product.updateMany(
                {
                    isActive: true,
                    category: category._id,
                    name: { $regex: rule.pattern }
                },
                {
                    $set: {
                        subcategory: rule.subcategory
                    }
                }
            );

            updatedCount += result.modifiedCount || 0;
        }
    }

    console.log(
        `Product subcategory normalization complete: ${updatedCount} product(s) normalized.`
    );

    return updatedCount;
}

module.exports = backfillProductSubcategories;
