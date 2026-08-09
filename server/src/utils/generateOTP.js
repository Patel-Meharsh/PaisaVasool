const crypto = require("crypto");

// Generate a random 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};


// Create a SHA-256 hash of the OTP
const hashOTP = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};


module.exports = {
    generateOTP,
    hashOTP
};