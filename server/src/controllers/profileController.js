// ============================================================
// GET USER PROFILE
// ============================================================

// Get the currently authenticated user's profile
const getProfile = async (req, res) => {
    try {

        // req.user is populated by authMiddleware.
        //
        // It contains the actual user retrieved from MongoDB.

        res.status(200).json({
            message: "Protected profile accessed successfully",

            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                isEmailVerified: req.user.isEmailVerified
            }
        });

    } catch (error) {

        console.error(
            "Profile error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Export controller
module.exports = {
    getProfile
};