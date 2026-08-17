// ============================================================
// IMPORT MONGOOSE
// ============================================================

const mongoose =
    require("mongoose");


// ============================================================
// PASSWORD RESET SCHEMA
// ============================================================

const passwordResetSchema =
    new mongoose.Schema(

        {

            // ------------------------------------------------
            // USER
            // ------------------------------------------------

            user: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "User",

                required:
                    true

            },


            // ------------------------------------------------
            // EMAIL
            // ------------------------------------------------

            email: {

                type:
                    String,

                required:
                    true,

                lowercase:
                    true,

                trim:
                    true

            },


            // ------------------------------------------------
            // OTP HASH
            // ------------------------------------------------

            otpHash: {

                type:
                    String,

                required:
                    true

            },


            // ------------------------------------------------
            // OTP EXPIRATION
            // ------------------------------------------------

            expiresAt: {

                type:
                    Date,

                required:
                    true

            },


            // ------------------------------------------------
            // OTP VERIFIED
            // ------------------------------------------------

            otpVerified: {

                type:
                    Boolean,

                default:
                    false

            },


            // ------------------------------------------------
            // OTP VERIFIED TIME
            // ------------------------------------------------

            verifiedAt: {

                type:
                    Date,

                default:
                    null

            },


            // ------------------------------------------------
            // RESET TOKEN HASH
            // ------------------------------------------------

            resetTokenHash: {

                type:
                    String,

                default:
                    null

            },


            // ------------------------------------------------
            // RESET TOKEN EXPIRATION
            // ------------------------------------------------

            resetTokenExpiresAt: {

                type:
                    Date,

                default:
                    null

            }

        },

        {

            timestamps:
                true

        }

    );


// ============================================================
// EXPORT MODEL
// ============================================================

const PasswordReset =
    mongoose.model(
        "PasswordReset",
        passwordResetSchema
    );


module.exports =
    PasswordReset;