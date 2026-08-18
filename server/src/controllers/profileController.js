const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const formatUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    profilePicture: user.profilePicture || {
        url: "",
        publicId: ""
    },
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive
});


const getProfile = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Profile fetched successfully",
            user: formatUser(req.user)
        });
    } catch (error) {
        console.error("Profile error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        if (phone && phone.trim()) {
            const phoneRegex = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
            if (!phoneRegex.test(phone.trim())) {
                return res.status(400).json({
                    message: "Please enter a valid Indian phone number"
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    name: name.trim(),
                    phone: phone ? phone.trim() : ""
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: formatUser(updatedUser)
        });
    } catch (error) {
        console.error("Update profile error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "All password fields are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New passwords do not match"
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        if (await user.comparePassword(newPassword)) {
            return res.status(400).json({
                message:
                    "New password must be different from current password"
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change password error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};


const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image"
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Upload the new image FIRST. The old Cloudinary asset is not
        // deleted until MongoDB has successfully stored the new reference.
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "paisavasool/profile-pictures",
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        const oldPublicId = user.profilePicture?.publicId || "";

        user.profilePicture = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
        };

        try {
            await user.save();
        } catch (saveError) {
            // MongoDB failed, so remove the newly uploaded asset and keep
            // the previous profile picture intact.
            try {
                await cloudinary.uploader.destroy(uploadResult.public_id);
            } catch (cleanupError) {
                console.error(
                    "New profile picture cleanup error:",
                    cleanupError.message
                );
            }
            throw saveError;
        }

        // Database now points at the new image, so deleting the old image
        // cannot leave the database referencing a missing old asset.
        if (oldPublicId && oldPublicId !== uploadResult.public_id) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error(
                    "Old profile picture delete error:",
                    deleteError.message
                );
            }
        }

        return res.status(200).json({
            message: "Profile picture updated successfully",
            user: formatUser(user)
        });
    } catch (error) {
        console.error(
            "Profile picture upload error:",
            error.message
        );
        return res.status(500).json({
            message: "Failed to upload profile picture"
        });
    }
};


const removeProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const oldPublicId = user.profilePicture?.publicId || "";

        // Clear DB first. If Cloudinary deletion later fails, the user can
        // still use the rest of the profile and the database has no stale
        // reference to the asset.
        user.profilePicture = { url: "", publicId: "" };
        await user.save();

        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error(
                    "Profile picture delete error:",
                    deleteError.message
                );
            }
        }

        return res.status(200).json({
            message: "Profile picture removed successfully",
            user: formatUser(user)
        });
    } catch (error) {
        console.error(
            "Remove profile picture error:",
            error.message
        );
        return res.status(500).json({
            message: "Failed to remove profile picture"
        });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    uploadProfilePicture,
    removeProfilePicture
};
