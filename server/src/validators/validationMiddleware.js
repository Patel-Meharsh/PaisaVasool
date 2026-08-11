    // ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

const validate = (schema) => {

    return (req, res, next) => {

        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        // If validation fails
        if (error) {

            return res.status(400).json({
                message: "Validation failed",
                errors: error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message
                }))
            });

        }

        next();
    };
};


module.exports = validate;