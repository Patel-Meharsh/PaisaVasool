const Joi = require("joi");


// ============================================================
// ADD CART ITEM
// ============================================================

const cartSchema = Joi.object({

    productId: Joi.string()
        .hex()
        .length(24)
        .required(),

    quantity: Joi.number()
        .integer()
        .min(1)
        .required()

});


// ============================================================
// UPDATE CART ITEM
// ============================================================

// Quantity 0 is intentionally allowed because the controller
// treats it as a remove operation.
const updateCartSchema = Joi.object({

    productId: Joi.string()
        .hex()
        .length(24)
        .required(),

    quantity: Joi.number()
        .integer()
        .min(0)
        .required()

});


module.exports = {
    cartSchema,
    updateCartSchema
};
