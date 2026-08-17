const express =
    require("express");

const multer =
    require("multer");

const router =
    express.Router();


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

const protect =
    require("../middleware/authMiddleware");


// ============================================================
// PROFILE CONTROLLERS
// ============================================================

const {

    getProfile,

    updateProfile,

    changePassword,

    uploadProfilePicture,

    removeProfilePicture

} =
    require("../controllers/profileController");


// ============================================================
// MULTER CONFIGURATION
// ============================================================

const storage =
    multer.memoryStorage();


const upload =
    multer({

        storage,

        limits: {

            fileSize:
                5 * 1024 * 1024

        },

        fileFilter:
            (req, file, callback) => {

                const allowedTypes = [

                    "image/jpeg",

                    "image/png",

                    "image/webp"

                ];


                if (
                    allowedTypes.includes(
                        file.mimetype
                    )
                ) {

                    callback(
                        null,
                        true
                    );

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
// GET PROFILE
// ============================================================

// GET /api/profile

router.get(

    "/profile",

    protect,

    getProfile

);


// ============================================================
// UPDATE PROFILE
// ============================================================

// PUT /api/profile

router.put(

    "/profile",

    protect,

    updateProfile

);


// ============================================================
// CHANGE PASSWORD
// ============================================================

// PUT /api/profile/password

router.put(

    "/profile/password",

    protect,

    changePassword

);


// ============================================================
// UPLOAD PROFILE PICTURE
// ============================================================

// POST /api/profile/picture

router.post(

    "/profile/picture",

    protect,

    (req, res, next) => {

        upload.single(
            "profilePicture"
        )(req, res, (error) => {

            if (error) {

                return res.status(400).json({

                    message:
                        error.message

                });

            }

            next();

        });

    },

    uploadProfilePicture

);


// ============================================================
// REMOVE PROFILE PICTURE
// ============================================================

// DELETE /api/profile/picture

router.delete(

    "/profile/picture",

    protect,

    removeProfilePicture

);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports =
    router;