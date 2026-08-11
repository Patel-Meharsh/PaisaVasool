// ============================================================
// CENTRALIZED ERROR HANDLING MIDDLEWARE
// ============================================================

const errorMiddleware = (err, req, res, next) => {

    console.error("ERROR:", err);


    // --------------------------------------------------------
    // 1. MONGOOSE INVALID OBJECT ID
    // --------------------------------------------------------

    if (err.name === "CastError") {

        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }


    // --------------------------------------------------------
    // 2. MONGOOSE VALIDATION ERROR
    // --------------------------------------------------------

    if (err.name === "ValidationError") {

        const errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }


    // --------------------------------------------------------
    // 3. MONGODB DUPLICATE KEY ERROR
    // --------------------------------------------------------

    if (err.code === 11000) {

        const field = Object.keys(err.keyValue)[0];

        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }


    // --------------------------------------------------------
    // 4. CUSTOM ERROR STATUS
    // --------------------------------------------------------

    const statusCode = err.statusCode || 500;


    // --------------------------------------------------------
    // 5. DEFAULT ERROR
    // --------------------------------------------------------

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : err.message
    });
};


module.exports = errorMiddleware;