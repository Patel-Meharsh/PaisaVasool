// Import the User model
// Used to create users and find existing users
const User = require("../models/User");

// Import the OTP model
// Used to store and retrieve OTP records from MongoDB
const Otp = require("../models/Otp");

// Import OTP utility functions
// generateOTP() -> creates a 6-digit OTP
// hashOTP() -> hashes the OTP before storing it
const {
    generateOTP,
    hashOTP
} = require("../utils/generateOTP");

// Import email utility
// Used to send the OTP to the user's email
const {
    sendOTPEmail
} = require("../utils/sendEmail");


// ============================================================
// REGISTER USER
// ============================================================

// Register a new user
const registerUser = async (req, res) => {
    try {

        // Get the registration data sent by the user
        const { name, email, password } = req.body;


        // ----------------------------------------------------
        // 1. Validate required fields
        // ----------------------------------------------------

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password"
            });
        }


        // ----------------------------------------------------
        // 2. Check whether the user already exists
        // ----------------------------------------------------

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }


        // ----------------------------------------------------
        // 3. Create the user
        // ----------------------------------------------------

        // The password will be hashed automatically
        // by the User model's pre-save middleware.
        const user = await User.create({
            name,
            email,
            password,

            // User must verify their email before
            // being considered fully verified.
            isEmailVerified: false
        });


        // ----------------------------------------------------
        // 4. Generate a 6-digit OTP
        // ----------------------------------------------------

        const otp = generateOTP();


        // ----------------------------------------------------
        // 5. Hash the OTP
        // ----------------------------------------------------

        // We don't store the actual OTP in the database.
        // We store its hash for better security.
        const otpHash = hashOTP(otp);


        // ----------------------------------------------------
        // 6. Set OTP expiration time
        // ----------------------------------------------------

        // OTP will be valid for 5 minutes.
        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );


        // ----------------------------------------------------
        // 7. Store OTP in MongoDB
        // ----------------------------------------------------

        await Otp.create({
            userId: user._id,

            // This tells us why this OTP was generated.
            purpose: "email_verification",

            // Store the hashed OTP instead of the
            // actual OTP.
            otpHash,

            // Store the expiration time.
            expiresAt
        });


        // ----------------------------------------------------
        // 8. Send OTP to user's email
        // ----------------------------------------------------

        // The actual OTP is sent to the user's email.
        // We don't store the actual OTP in MongoDB.
        await sendOTPEmail(user.email, otp);


        // ----------------------------------------------------
        // 9. Send successful response
        // ----------------------------------------------------

        res.status(201).json({
            message:
                "Registration successful. Please verify your email using the OTP sent to your email.",

            // Send the user ID because we'll need it
            // during email verification.
            userId: user._id
        });

    } catch (error) {

        // Print the actual error in the terminal
        // so we can debug backend problems.
        console.error(
            "Registration error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// VERIFY EMAIL
// ============================================================

// Verify user's email using the OTP received by email
const verifyEmail = async (req, res) => {
    try {

        // Get userId and OTP from the request body
        const { userId, otp } = req.body;


        // ----------------------------------------------------
        // 1. Validate required fields
        // ----------------------------------------------------

        if (!userId || !otp) {
            return res.status(400).json({
                message: "User ID and OTP are required"
            });
        }


        // ----------------------------------------------------
        // 2. Find the user
        // ----------------------------------------------------

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // ----------------------------------------------------
        // 3. Check whether email is already verified
        // ----------------------------------------------------

        if (user.isEmailVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            });
        }


        // ----------------------------------------------------
        // 4. Find the latest email verification OTP
        // ----------------------------------------------------

        const otpRecord = await Otp.findOne({
            userId: user._id,
            purpose: "email_verification"
        }).sort({
            createdAt: -1
        });


        // If no OTP exists, it may have expired
        // or may not have been generated.
        if (!otpRecord) {
            return res.status(400).json({
                message: "OTP not found or expired"
            });
        }


        // ----------------------------------------------------
        // 5. Check whether OTP has expired
        // ----------------------------------------------------

        if (otpRecord.expiresAt < new Date()) {

            // Delete expired OTP
            await Otp.deleteOne({
                _id: otpRecord._id
            });

            return res.status(400).json({
                message: "OTP has expired"
            });
        }


        // ----------------------------------------------------
        // 6. Compare entered OTP with stored hash
        // ----------------------------------------------------

        // The entered OTP is hashed in exactly the same
        // way as the OTP that was stored during registration.
        const isOtpCorrect =
            hashOTP(otp) === otpRecord.otpHash;


        // If OTP doesn't match
        if (!isOtpCorrect) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }


        // ----------------------------------------------------
        // 7. Mark the user's email as verified
        // ----------------------------------------------------

        user.isEmailVerified = true;

        await user.save();


        // ----------------------------------------------------
        // 8. Delete the OTP
        // ----------------------------------------------------

        // OTP has already been successfully used,
        // so we don't need it anymore.
        await Otp.deleteOne({
            _id: otpRecord._id
        });


        // ----------------------------------------------------
        // 9. Send successful response
        // ----------------------------------------------------

        res.status(200).json({
            message: "Email verified successfully"
        });

    } catch (error) {

        // Print error in terminal for debugging
        console.error(
            "Email verification error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// LOGIN USER
// ============================================================

// Login an existing user
const loginUser = async (req, res) => {
    try {

        // Get login information from request
        const { email, password } = req.body;


        // ----------------------------------------------------
        // 1. Validate required fields
        // ----------------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }


        // ----------------------------------------------------
        // 2. Find the user by email
        // ----------------------------------------------------

        const user = await User.findOne({ email });


        // If user doesn't exist
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // ----------------------------------------------------
        // 3. Compare entered password with hashed password
        // ----------------------------------------------------

        const isPasswordCorrect =
            await user.comparePassword(password);


        // If password is incorrect
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // ----------------------------------------------------
        // 4. Login successful
        // ----------------------------------------------------

        res.status(200).json({
            message: "Login successful",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        // Print error in terminal
        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

// Export all controller functions so that
// the route files can use them.
module.exports = {
    registerUser,
    verifyEmail,
    loginUser
};