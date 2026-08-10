// Import jsonwebtoken
// This package is used to create and verify JWT tokens.
const jwt = require("jsonwebtoken");


// ============================================================
// GENERATE JWT
// ============================================================

// Generate a JWT token for a user
const generateToken = (user) => {

    return jwt.sign(
        {
            // Store the user's ID inside the token
            // so we know which user is making a request.
            userId: user._id,

            // Store email for identification if needed.
            email: user.email,

            // Store role for authorization later.
            // For example: user / admin.
            role: user.role
        },

        // Secret key used to sign the token.
        // This comes from the .env file.
        process.env.JWT_SECRET,

        {
            // Token will remain valid for 1 day.
            expiresIn: "1d"
        }
    );
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    generateToken
};