// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

const validate = (schema) => {
    return (req, res, next) => {

        const {
            error,
            value
        } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message
                }))
            });
        }

        // Use the validated/sanitized object. Without this assignment,
        // stripUnknown only validates a copy and the original request body
        // can still contain unexpected fields.
        req.body = value;

        next();
    };
};


module.exports = validate;
