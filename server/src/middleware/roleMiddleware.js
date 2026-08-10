// ============================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ============================================================

// This middleware checks whether the authenticated user
// has one of the roles allowed to access a route.
//
// IMPORTANT:
// authMiddleware must run BEFORE this middleware.
//
// Example:
//
// router.get(
//     "/admin",
//     protect,
//     authorize("admin"),
//     controller
// );

const authorize = (...allowedRoles) => {

    return (req, res, next) => {

        // ----------------------------------------------------
        // 1. Make sure authentication has already happened
        // ----------------------------------------------------

        // req.user is created by authMiddleware.
        //
        // If req.user doesn't exist, the user hasn't been
        // authenticated yet.

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }


        // ----------------------------------------------------
        // 2. Check whether user's role is allowed
        // ----------------------------------------------------

        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                message: "Access denied"
            });
        }


        // ----------------------------------------------------
        // 3. User has the required role
        // ----------------------------------------------------

        next();
    };
};


// Export middleware
module.exports = authorize;