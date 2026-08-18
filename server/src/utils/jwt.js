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
            // For example: customer / admin.
            role: user.role,

            // Store the current session version.
            // If the user's sessionVersion changes later,
            // authMiddleware will reject this older token.
            sessionVersion:
                user.sessionVersion || 0
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