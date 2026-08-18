// Import mongoose
const mongoose = require("mongoose");

// Import bcryptjs for password hashing
const bcrypt = require("bcryptjs");


// ============================================================
// USER SCHEMA
// ============================================================

const userSchema = new mongoose.Schema(
    {

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        role: {
            type: String,
            enum: [
                "customer",
                "admin"
            ],
            default: "customer"
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        isActive: {
            type: Boolean,
            default: true
        },

        // Optional profile information used by the profile page.
        phone: {
            type: String,
            default: "",
            trim: true
        },

        profilePicture: {
            url: {
                type: String,
                default: ""
            },
            publicId: {
                type: String,
                default: ""
            }
        },

        // Every security-sensitive session invalidation increments this.
        // Existing JWTs contain the previous value and are rejected by
        // authMiddleware when the values no longer match.
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

        // Password changes and account activation/deactivation
        // invalidate all previously issued JWTs.
        if (
            !this.isNew &&
            (
                this.isModified("password") ||
                this.isModified("isActive")
            )
        ) {
            this.sessionVersion += 1;
        }


        // Registration verification already supplies a bcrypt hash.
        if (
            this.$locals &&
            this.$locals.passwordAlreadyHashed
        ) {
            return;
        }


        // Do not re-hash an unchanged password.
        if (!this.isModified("password")) {
            return;
        }


        const salt = await bcrypt.genSalt(10);

        this.password = await bcrypt.hash(
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
// CREATE MODEL
// ============================================================

const User = mongoose.model(
    "User",
    userSchema
);


module.exports = User;
