const Joi = require("joi");


// ============================================================
// ADD / UPDATE CART ITEM
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


module.exports = {
    cartSchema
};