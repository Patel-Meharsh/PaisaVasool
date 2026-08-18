// Import jsonwebtoken
// Used to verify the JWT sent by the client.
const jwt = require("jsonwebtoken");

// Import the User model
// Used to find the actual user in MongoDB.
const User = require("../models/User");


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

// This middleware checks whether the user has a valid JWT,
// loads the actual user from MongoDB, verifies the account is
// still active, and verifies that the token belongs to the
// user's current session version.
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

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }


        // ----------------------------------------------------
        // 4. Extract the JWT
        // ----------------------------------------------------

        const token = authHeader.split(" ")[1];


        if (!token) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }


        // ----------------------------------------------------
        // 5. Verify the JWT
        // ----------------------------------------------------

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

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }


        // ----------------------------------------------------
        // 8. Check whether the account is still active
        // ----------------------------------------------------

        // A valid JWT must not be enough to access the account
        // after an administrator deactivates the user.
        if (!user.isActive) {
            return res.status(401).json({
                message: "Your account is inactive. Please contact support."
            });
        }


        // ----------------------------------------------------
        // 9. Check session version
        // ----------------------------------------------------

        // Older tokens are rejected after a password change,
        // password reset, or account activation/deactivation.
        // Tokens created before sessionVersion was introduced
        // may not contain the field, so they are treated as
        // version 0 for backwards compatibility.
        const tokenSessionVersion =
            Number.isInteger(decoded.sessionVersion)
                ? decoded.sessionVersion
                : 0;

        const currentSessionVersion =
            Number.isInteger(user.sessionVersion)
                ? user.sessionVersion
                : 0;

        if (
            tokenSessionVersion !==
            currentSessionVersion
        ) {
            return res.status(401).json({
                message: "Session expired. Please login again."
            });
        }


        // ----------------------------------------------------
        // 10. Store the actual user in req.user
        // ----------------------------------------------------

        req.user = user;


        // ----------------------------------------------------
        // 11. Continue to the protected controller
        // ----------------------------------------------------

        next();

    } catch (error) {

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