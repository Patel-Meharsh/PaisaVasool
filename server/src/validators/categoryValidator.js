const Joi = require("joi");


// ============================================================
// CATEGORY VALIDATION
// ============================================================

const categorySchema = Joi.object({

    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()

});


module.exports = {
    categorySchema
};