// ============================================================
// IMPORT USER MODEL
// ============================================================

const User =
    require("../models/User");


// ============================================================
// IMPORT CLOUDINARY
// ============================================================

const cloudinary =
    require("../config/cloudinary");


// ============================================================
// HELPER - FORMAT USER RESPONSE
// ============================================================

const formatUser = (user) => {

    return {

        _id:
            user._id,

        name:
            user.name,

        email:
            user.email,

        phone:
            user.phone || "",

        profilePicture:
            user.profilePicture || {
                url: "",
                publicId: ""
            },

        role:
            user.role,

        isEmailVerified:
            user.isEmailVerified,

        isActive:
            user.isActive

    };

};


// ============================================================
// GET USER PROFILE
// ============================================================

const getProfile = async (req, res) => {

    try {

        res.status(200).json({

            message:
                "Profile fetched successfully",

            user:
                formatUser(req.user)

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

const updateProfile = async (req, res) => {

    try {

        const {

            name,

            phone

        } = req.body;


        // ----------------------------------------------------
        // VALIDATE NAME
        // ----------------------------------------------------

        if (!name || !name.trim()) {

            return res.status(400).json({

                message:
                    "Name is required"

            });

        }


        // ----------------------------------------------------
        // VALIDATE PHONE
        // ----------------------------------------------------

        if (phone && phone.trim()) {

            const phoneRegex =
                /^(?:\+91[\s-]?)?[6-9]\d{9}$/;


            if (!phoneRegex.test(phone.trim())) {

                return res.status(400).json({

                    message:
                        "Please enter a valid Indian phone number"

                });

            }

        }


        // ----------------------------------------------------
        // UPDATE USER
        // ----------------------------------------------------

        const updatedUser =
            await User.findByIdAndUpdate(

                req.user._id,

                {

                    name:
                        name.trim(),

                    phone:
                        phone
                            ? phone.trim()
                            : ""

                },

                {

                    new: true,

                    runValidators: true

                }

            );


        // ----------------------------------------------------
        // USER NOT FOUND
        // ----------------------------------------------------

        if (!updatedUser) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Profile updated successfully",

            user:
                formatUser(updatedUser)

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
// CHANGE PASSWORD
// ============================================================

const changePassword = async (req, res) => {

    try {

        const {

            currentPassword,

            newPassword,

            confirmPassword

        } = req.body;


        // ----------------------------------------------------
        // VALIDATE FIELDS
        // ----------------------------------------------------

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({

                message:
                    "All password fields are required"

            });

        }


        // ----------------------------------------------------
        // CHECK NEW PASSWORD LENGTH
        // ----------------------------------------------------

        if (newPassword.length < 6) {

            return res.status(400).json({

                message:
                    "New password must be at least 6 characters"

            });

        }


        // ----------------------------------------------------
        // CHECK PASSWORD CONFIRMATION
        // ----------------------------------------------------

        if (
            newPassword !==
            confirmPassword
        ) {

            return res.status(400).json({

                message:
                    "New passwords do not match"

            });

        }


        // ----------------------------------------------------
        // GET USER WITH PASSWORD
        // ----------------------------------------------------

        const user =
            await User.findById(
                req.user._id
            );


        if (!user) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }


        // ----------------------------------------------------
        // CHECK CURRENT PASSWORD
        // ----------------------------------------------------

        const passwordMatches =
            await user.comparePassword(
                currentPassword
            );


        if (!passwordMatches) {

            return res.status(400).json({

                message:
                    "Current password is incorrect"

            });

        }


        // ----------------------------------------------------
        // PREVENT SAME PASSWORD
        // ----------------------------------------------------

        const samePassword =
            await user.comparePassword(
                newPassword
            );


        if (samePassword) {

            return res.status(400).json({

                message:
                    "New password must be different from current password"

            });

        }


        // ----------------------------------------------------
        // UPDATE PASSWORD
        // ----------------------------------------------------

        user.password =
            newPassword;


        await user.save();


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        res.status(200).json({

            message:
                "Password changed successfully"

        });

    } catch (error) {

        console.error(
            "Change password error:",
            error.message
        );

        res.status(500).json({

            message:
                "Server error"

        });

    }

};


// ============================================================
// UPLOAD PROFILE PICTURE
// ============================================================

const uploadProfilePicture =
    async (req, res) => {

        try {

            // ------------------------------------------------
            // CHECK FILE
            // ------------------------------------------------

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please select an image"

                });

            }


            // ------------------------------------------------
            // GET CURRENT USER
            // ------------------------------------------------

            const user =
                await User.findById(
                    req.user._id
                );


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            // ------------------------------------------------
            // DELETE OLD IMAGE
            // ------------------------------------------------

            if (
                user.profilePicture &&
                user.profilePicture.publicId
            ) {

                try {

                    await cloudinary.uploader.destroy(

                        user.profilePicture.publicId

                    );

                } catch (error) {

                    console.error(
                        "Old profile picture delete error:",
                        error.message
                    );

                }

            }


            // ------------------------------------------------
            // UPLOAD NEW IMAGE
            // ------------------------------------------------

            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(

                                {

                                    folder:
                                        "paisavasool/profile-pictures",

                                    resource_type:
                                        "image"

                                },

                                (error, result) => {

                                    if (error) {

                                        reject(error);

                                        return;

                                    }

                                    resolve(result);

                                }

                            );


                        stream.end(
                            req.file.buffer
                        );

                    }
                );


            // ------------------------------------------------
            // SAVE IMAGE DETAILS
            // ------------------------------------------------

            user.profilePicture = {

                url:
                    uploadResult.secure_url,

                publicId:
                    uploadResult.public_id

            };


            await user.save();


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            res.status(200).json({

                message:
                    "Profile picture updated successfully",

                user:
                    formatUser(user)

            });

        } catch (error) {

            console.error(
                "Profile picture upload error:",
                error.message
            );

            res.status(500).json({

                message:
                    "Failed to upload profile picture"

            });

        }

    };


// ============================================================
// REMOVE PROFILE PICTURE
// ============================================================

const removeProfilePicture =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                );


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            // ------------------------------------------------
            // DELETE FROM CLOUDINARY
            // ------------------------------------------------

            if (
                user.profilePicture &&
                user.profilePicture.publicId
            ) {

                try {

                    await cloudinary.uploader.destroy(

                        user.profilePicture.publicId

                    );

                } catch (error) {

                    console.error(
                        "Profile picture delete error:",
                        error.message
                    );

                }

            }


            // ------------------------------------------------
            // CLEAR DATABASE
            // ------------------------------------------------

            user.profilePicture = {

                url: "",

                publicId: ""

            };


            await user.save();


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            res.status(200).json({

                message:
                    "Profile picture removed successfully",

                user:
                    formatUser(user)

            });

        } catch (error) {

            console.error(
                "Remove profile picture error:",
                error.message
            );

            res.status(500).json({

                message:
                    "Failed to remove profile picture"

            });

        }

    };


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {

    getProfile,

    updateProfile,

    changePassword,

    uploadProfilePicture,

    removeProfilePicture

};