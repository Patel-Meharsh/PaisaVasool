const express = require("express");
const multer = require("multer");

const router = express.Router();


// ============================================================
// AUTHENTICATION
// ============================================================

const protect = require("../middleware/authMiddleware");


// ============================================================
// VALIDATION
// ============================================================

const validate = require("../validators/validationMiddleware");
const {
    profileSchema,
    changePasswordSchema
} = require("../validators/profileValidator");


// ============================================================
// PROFILE CONTROLLERS
// ============================================================

const {
    getProfile,
    updateProfile,
    changePassword,
    uploadProfilePicture,
    removeProfilePicture
} = require("../controllers/profileController");


// ============================================================
// MULTER CONFIGURATION
// ============================================================

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(
                new Error(
                    "Only JPG, PNG and WEBP images are allowed"
                )
            );
        }
    }
});


// ============================================================
// IMAGE SIGNATURE VALIDATION
// ============================================================

const hasValidImageSignature = (buffer, mimetype) => {
    if (!buffer || buffer.length < 12) {
        return false;
    }

    if (mimetype === "image/jpeg") {
        return (
            buffer[0] === 0xff &&
            buffer[1] === 0xd8 &&
            buffer[2] === 0xff
        );
    }

    if (mimetype === "image/png") {
        return (
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a
        );
    }

    if (mimetype === "image/webp") {
        return (
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP"
        );
    }

    return false;
};


// ============================================================
// GET PROFILE
// ============================================================

router.get(
    "/profile",
    protect,
    getProfile
);


// ============================================================
// UPDATE PROFILE
// ============================================================

router.put(
    "/profile",
    protect,
    validate(profileSchema),
    updateProfile
);


// ============================================================
// CHANGE PASSWORD
// ============================================================

router.put(
    "/profile/password",
    protect,
    validate(changePasswordSchema),
    changePassword
);


// ============================================================
// UPLOAD PROFILE PICTURE
// ============================================================

router.post(
    "/profile/picture",
    protect,
    (req, res, next) => {
        upload.single("profilePicture")(
            req,
            res,
            (error) => {
                if (error) {
                    return res.status(400).json({
                        message: error.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        message: "Please select an image"
                    });
                }

                if (
                    !hasValidImageSignature(
                        req.file.buffer,
                        req.file.mimetype
                    )
                ) {
                    return res.status(400).json({
                        message:
                            "The uploaded file is not a valid JPG, PNG or WEBP image"
                    });
                }

                next();
            }
        );
    },
    uploadProfilePicture
);


// ============================================================
// REMOVE PROFILE PICTURE
// ============================================================

router.delete(
    "/profile/picture",
    protect,
    removeProfilePicture
);


module.exports = router;
