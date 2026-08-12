// ============================================================
// USER MODEL
// ============================================================

const User = require("../models/User");


// ============================================================
// GET USER PROFILE
// ============================================================

// Get the currently authenticated user's profile

const getProfile = async (req, res) => {

    try {

        // req.user is populated by authMiddleware.

        res.status(200).json({

            message:
                "Protected profile accessed successfully",

            user: {

                _id:
                    req.user._id,

                name:
                    req.user.name,

                email:
                    req.user.email,

                role:
                    req.user.role,

                isEmailVerified:
                    req.user.isEmailVerified

            }

        });

    } catch (error) {

        console.error(
            "Profile error:",
            error.message
        );

        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// UPDATE USER PROFILE
// ============================================================

// Update the currently authenticated user's profile

const updateProfile = async (req, res) => {

    try {

        const {
            name
        } = req.body;


        // ----------------------------------------------------
        // Validate name
        // ----------------------------------------------------

        if (!name || !name.trim()) {

            return res.status(400).json({

                message:
                    "Name is required"

            });

        }


        // ----------------------------------------------------
        // Update user
        // ----------------------------------------------------

        const updatedUser =
            await User.findByIdAndUpdate(

                req.user._id,

                {
                    name:
                        name.trim()
                },

                {
                    new: true,

                    runValidators: true

                }

            );


        // ----------------------------------------------------
        // User not found
        // ----------------------------------------------------

        if (!updatedUser) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }


        // ----------------------------------------------------
        // Send updated user
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Profile updated successfully",

            user: {

                _id:
                    updatedUser._id,

                name:
                    updatedUser.name,

                email:
                    updatedUser.email,

                role:
                    updatedUser.role,

                isEmailVerified:
                    updatedUser.isEmailVerified

            }

        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error.message
        );


        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {

    getProfile,

    updateProfile

};