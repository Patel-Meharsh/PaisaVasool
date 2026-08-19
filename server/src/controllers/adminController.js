// ============================================================
// ADMIN TEST CONTROLLER
// ============================================================

// This controller is only used to test whether
// role-based authorization is working correctly.

const adminDashboard = async (req, res) => {
    try {

        res.status(200).json({
            message: "Welcome to the admin dashboard",

            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });

    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Export controller
module.exports = {
    adminDashboard
};