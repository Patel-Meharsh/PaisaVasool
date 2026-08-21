// ============================================================
// PRODUCT QUERY VALIDATION
// ============================================================

const mongoose = require("mongoose");

// Escape user input so regex metacharacters cannot create
// unintended patterns.
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
        if (
            typeof category !== "string" ||
            !mongoose.Types.ObjectId.isValid(category)
        ) {
            return res.status(400).json({
                message: "Invalid category ID"
            });
        }

        // Keep the category as a string. Mongoose find()/distinct()
        // automatically cast this value to ObjectId. The previous
        // middleware converted it into an ObjectId before the controller,
        // which made the aggregation and normal-query paths behave
        // differently.
        req.query.category = category.trim();
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

    // When a category is selected without an explicit sort, use the
    // normal Mongoose query path. This guarantees ObjectId casting for
    // the category filter. The catalogue's unfiltered request continues
    // to use the aggregation path for category/type grouping.
    if (category !== undefined && sort === undefined) {
        req.query.sort = "name_asc";
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
