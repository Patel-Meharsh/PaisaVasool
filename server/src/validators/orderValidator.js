const Joi = require("joi");


// ============================================================
// CREATE ORDER
// ============================================================

const createOrderSchema = Joi.object({

    shippingAddress: Joi.object({

        fullName: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required(),

        address: Joi.string()
            .trim()
            .min(5)
            .max(300)
            .required(),

        city: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required(),

        state: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required(),

        postalCode: Joi.string()
            .pattern(/^[0-9]{6}$/)
            .required(),

        country: Joi.string()
            .trim()
            .default("India")

    }).required(),

    paymentMethod: Joi.string()
        .valid("cod", "online")
        .required()

});


module.exports = {
    createOrderSchema
};