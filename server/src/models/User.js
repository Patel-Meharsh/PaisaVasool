// Import mongoose
const mongoose = require("mongoose");

// Import bcryptjs for password hashing
const bcrypt = require("bcryptjs");


// ============================================================
// USER SCHEMA
// ============================================================

const userSchema = new mongoose.Schema(

    {

        // ----------------------------------------------------
        // User's full name
        // ----------------------------------------------------

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ----------------------------------------------------
        // User's email address
        // ----------------------------------------------------

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },


        // ----------------------------------------------------
        // User's password
        // ----------------------------------------------------

        password: {
            type: String,
            required: true,
            minlength: 6
        },


        // ----------------------------------------------------
        // User's role
        // ----------------------------------------------------

        role: {
            type: String,
            enum: [
                "customer",
                "admin"
            ],
            default: "customer"
        },


        // ----------------------------------------------------
        // Email verification status
        // ----------------------------------------------------

        isEmailVerified: {
            type: Boolean,
            default: false
        },


        // ----------------------------------------------------
        // Account active status
        // ----------------------------------------------------

        isActive: {
            type: Boolean,
            default: true
        }

    },

    {

        timestamps: true

    }

);


// ============================================================
// PASSWORD HASHING
// ============================================================

userSchema.pre(
    "save",
    async function() {

        // ----------------------------------------------------
        // If this password was already hashed before the User
        // document was created, don't hash it again.
        //
        // This is used only when converting a verified
        // PendingRegistration into a real User.
        // ----------------------------------------------------

        if (
            this.$locals &&
            this.$locals.passwordAlreadyHashed
        ) {

            return;

        }


        // ----------------------------------------------------
        // If password hasn't changed, don't hash again.
        // ----------------------------------------------------

        if (!this.isModified("password")) {

            return;

        }


        // ----------------------------------------------------
        // Generate salt
        // ----------------------------------------------------

        const salt =
            await bcrypt.genSalt(10);


        // ----------------------------------------------------
        // Hash password
        // ----------------------------------------------------

        this.password =
            await bcrypt.hash(
                this.password,
                salt
            );

    }
);


// ============================================================
// COMPARE PASSWORD
// ============================================================

userSchema.methods.comparePassword =
    async function(enteredPassword) {

        return await bcrypt.compare(
            enteredPassword,
            this.password
        );

    };


// ============================================================
// CREATE USER MODEL
// ============================================================

const User =
    mongoose.model(
        "User",
        userSchema
    );


// ============================================================
// EXPORT
// ============================================================

module.exports = User;