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
        },


        // ----------------------------------------------------
        // SESSION VERSION
        // ----------------------------------------------------
        // Every time a security-sensitive account change happens
        // (password change or account activation/deactivation),
        // this value is increased.
        //
        // JWTs contain the version that was current when they were
        // issued. authMiddleware compares the JWT version with the
        // current database version, which lets us invalidate all
        // previously issued tokens without storing every token.
        // ----------------------------------------------------

        sessionVersion: {
            type: Number,
            default: 0
        }

    },

    {

        timestamps: true

    }

);


// ============================================================
// PASSWORD HASHING + SESSION INVALIDATION
// ============================================================

userSchema.pre(
    "save",
    async function() {

        // ----------------------------------------------------
        // Invalidate existing sessions when a security-sensitive
        // field changes.
        // ----------------------------------------------------

        if (
            !this.isNew &&
            (
                this.isModified("password") ||
                this.isModified("isActive")
            )
        ) {

            this.sessionVersion += 1;

        }


        // ----------------------------------------------------
        // If this password was already hashed before the User
        // document was created, don't hash it again.
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