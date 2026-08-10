// Import jsonwebtoken
// Used to verify the JWT sent by the client.
const jwt = require("jsonwebtoken");

// Import the User model
// Used to find the actual user in MongoDB.
const User = require("../models/User");


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

// This middleware checks whether the user has a valid JWT
// and then loads the actual user from MongoDB.
const protect = async (req, res, next) => {
    try {

        // ----------------------------------------------------
        // 1. Get the Authorization header
        // ----------------------------------------------------

        const authHeader = req.headers.authorization;


        // ----------------------------------------------------
        // 2. Check whether the header exists
        // ----------------------------------------------------

        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }


        // ----------------------------------------------------
        // 3. Check Bearer token format
        // ----------------------------------------------------

        // Expected format:
        //
        // Authorization: Bearer <token>
        //

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }


        // ----------------------------------------------------
        // 4. Extract the JWT
        // ----------------------------------------------------

        const token = authHeader.split(" ")[1];


        // ----------------------------------------------------
        // 5. Verify the JWT
        // ----------------------------------------------------

        // jwt.verify() checks:
        // - Whether the token is valid
        // - Whether it was signed using our JWT_SECRET
        // - Whether it has expired
        //
        // If verification fails, an error is thrown.

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // ----------------------------------------------------
        // 6. Find the actual user in MongoDB
        // ----------------------------------------------------

        const user = await User.findById(decoded.userId)
            .select("-password");


        // ----------------------------------------------------
        // 7. Check whether the user still exists
        // ----------------------------------------------------

        // The JWT could be valid even if the user was later
        // deleted from the database.
        //
        // Therefore we check MongoDB as well.

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }


        // ----------------------------------------------------
        // 8. Store the actual user in req.user
        // ----------------------------------------------------

        // Controllers can now access the current user through:
        //
        // req.user
        //
        // Password is excluded because we used:
        // .select("-password")

        req.user = user;


        // ----------------------------------------------------
        // 9. Continue to the protected controller
        // ----------------------------------------------------

        next();

    } catch (error) {

        // JWT verification errors will end up here.
        //
        // Examples:
        // - Invalid token
        // - Expired token
        // - Modified token
        // - Wrong secret

        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};


// ============================================================
// EXPORT MIDDLEWARE
// ============================================================

module.exports = protect;