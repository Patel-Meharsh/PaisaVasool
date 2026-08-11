const Joi = require("joi");


// ============================================================
// CREATE PRODUCT
// ============================================================

const createProductSchema = Joi.object({

    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),

    description: Joi.string()
        .trim()
        .min(5)
        .max(1000)
        .required(),

    price: Joi.number()
        .positive()
        .required(),

    stock: Joi.number()
        .integer()
        .min(0)
        .required(),

    images: Joi.array()
        .items(Joi.string().uri())
        .min(1)
        .required(),

    brand: Joi.string()
        .trim()
        .max(100)
        .required(),

    category: Joi.string()
        .hex()
        .length(24)
        .required(),

    isActive: Joi.boolean()
        .optional()

});


// ============================================================
// UPDATE PRODUCT
// ============================================================

const updateProductSchema = Joi.object({

    name: Joi.string()
        .trim()
        .min(2)
        .max(100),

    description: Joi.string()
        .trim()
        .min(5)
        .max(1000),

    price: Joi.number()
        .positive(),

    stock: Joi.number()
        .integer()
        .min(0),

    images: Joi.array()
        .items(Joi.string().uri())
        .min(1),

    brand: Joi.string()
        .trim()
        .max(100),

    category: Joi.string()
        .hex()
        .length(24),

    isActive: Joi.boolean()

}).min(1);


module.exports = {
    createProductSchema,
    updateProductSchema
};