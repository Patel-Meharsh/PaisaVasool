// ============================================================
// PRODUCT QUERY VALIDATION
// ============================================================

const mongoose = require("mongoose");


// Product search is implemented with MongoDB regular expressions.
// Escape user input so regex metacharacters cannot create expensive
// or unintended patterns.
const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


const validateProductQuery = (req, res, next) => {
    const {
        search,
        category,
        minPrice,
        maxPrice,
        sort,
        page,
        limit
    } = req.query;

    if (search !== undefined) {
        if (typeof search !== "string" || search.length > 100) {
            return res.status(400).json({
                message: "Search query is invalid or too long"
            });
        }

        req.query.search = escapeRegex(search.trim());
    }

    if (category !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        // Important: the catalogue default-order query uses MongoDB
        // aggregation. Aggregation does not automatically cast a string
        // category ID to ObjectId like Model.find() does. Normalize it
        // here once so both query paths behave identically.
        req.query.category = new mongoose.Types.ObjectId(category);
    }

    const allowedSorts = [
        "price_asc",
        "price_desc",
        "name_asc",
        "name_desc"
    ];

    if (
        sort !== undefined &&
        !allowedSorts.includes(sort)
    ) {
        return res.status(400).json({
            message: "Invalid sort option"
        });
    }

    const numericFields = [
        ["minPrice", minPrice],
        ["maxPrice", maxPrice]
    ];

    for (const [name, value] of numericFields) {
        if (value === undefined || value === "") {
            continue;
        }

        const number = Number(value);

        if (!Number.isFinite(number) || number < 0) {
            return res.status(400).json({
                message: `${name} must be a valid non-negative number`
            });
        }
    }

    if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        Number(minPrice) > Number(maxPrice)
    ) {
        return res.status(400).json({
            message: "Minimum price cannot be greater than maximum price"
        });
    }

    if (page !== undefined) {
        const pageNumber = Number(page);
        if (!Number.isInteger(pageNumber) || pageNumber < 1) {
            return res.status(400).json({
                message: "Page must be a positive integer"
            });
        }
    }

    if (limit !== undefined) {
        const limitNumber = Number(limit);
        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 50
        ) {
            return res.status(400).json({
                message: "Limit must be an integer between 1 and 50"
            });
        }
    }

    next();
};

module.exports = validateProductQuery;
