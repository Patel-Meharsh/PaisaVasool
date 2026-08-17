// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================

const cloudinary = require("cloudinary").v2;


// ============================================================
// CONFIGURE CLOUDINARY
// ============================================================

cloudinary.config({

    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET

});


// ============================================================
// EXPORT
// ============================================================

module.exports = cloudinary;