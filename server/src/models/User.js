// Import mongoose
const mongoose = require("mongoose");

// Import bcryptjs for password hashing
const bcrypt = require("bcryptjs");


// Create the User schema
const userSchema = new mongoose.Schema(
    {
        // User's full name
        name: {
            type: String,
            required: true,
            trim: true
        },

        // User's email address
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // User's password
        password: {
            type: String,
            required: true,
            minlength: 6
        },

        // User's role
        // Normal users will be "customer"
        // Admin users will be "admin"
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer"
        },

        // Indicates whether the user's email has been verified
        isEmailVerified: {
            type: Boolean,
            default: false
        }
    },

    // Automatically adds createdAt and updatedAt
    {
        timestamps: true
    }
);


// Hash the password before saving the user
userSchema.pre("save", async function() {

    // If password hasn't been changed, don't hash it again
    if (!this.isModified("password")) {
        return;
    }

    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);

});


// Compare a entered password with the stored hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


// Create the User model
const User = mongoose.model("User", userSchema);


// Export the User model
module.exports = User;