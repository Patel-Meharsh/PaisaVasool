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
// Used to send OTP emails and Welcome Email
const {
    sendOTPEmail,
    sendWelcomeEmail,
    sendLoginSuccessEmail
} = require("../utils/sendEmail");

// Import JWT utility
// Used to generate a JWT after successful login
const {
    generateToken
} = require("../utils/jwt");


// ============================================================
// REGISTER USER
// ============================================================

// Register a new user
const registerUser = async (req, res) => {
    try {

        // Get registration data from request body
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

        // Password hashing is handled automatically
        // by the User model's pre-save middleware.
        const user = await User.create({
            name,
            email,
            password,

            // User must verify their email.
            isEmailVerified: false
        });


        // ----------------------------------------------------
        // 4. Generate a 6-digit OTP
        // ----------------------------------------------------

        const otp = generateOTP();


        // ----------------------------------------------------
        // 5. Hash the OTP
        // ----------------------------------------------------

        // We store the hash instead of the actual OTP.
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
            purpose: "email_verification",
            otpHash,
            expiresAt
        });


        // ----------------------------------------------------
        // 8. Send OTP to user's email
        // ----------------------------------------------------

        await sendOTPEmail(user.email, otp);


        // ----------------------------------------------------
        // 9. Send registration response
        // ----------------------------------------------------

        res.status(201).json({
            message:
                "Registration successful. Please verify your email using the OTP sent to your email.",

            // We need this ID for email verification.
            userId: user._id
        });

    } catch (error) {

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

// Verify user's email using the OTP
const verifyEmail = async (req, res) => {
    try {

        // Get user ID and OTP from request body
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


        // OTP doesn't exist
        if (!otpRecord) {
            return res.status(400).json({
                message: "OTP not found or expired"
            });
        }


        // ----------------------------------------------------
        // 5. Check OTP expiration
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
        // 6. Compare entered OTP
        // ----------------------------------------------------

        const isOtpCorrect =
            hashOTP(otp) === otpRecord.otpHash;


        // Incorrect OTP
        if (!isOtpCorrect) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }


        // ----------------------------------------------------
        // 7. Mark email as verified
        // ----------------------------------------------------

        user.isEmailVerified = true;

        await user.save();


        // ----------------------------------------------------
        // 8. Send welcome email after successful verification
        // ----------------------------------------------------

        await sendWelcomeEmail(
            user.email,
            user.name
        );


        // ----------------------------------------------------
        // 9. Delete OTP after successful verification
        // ----------------------------------------------------

        await Otp.deleteOne({
            _id: otpRecord._id
        });


        // ----------------------------------------------------
        // 10. Send successful response
        // ----------------------------------------------------

        res.status(200).json({
            message: "Email verified successfully"
        });

    } catch (error) {

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


        // User doesn't exist
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // ----------------------------------------------------
        // 3. Compare password
        // ----------------------------------------------------

        const isPasswordCorrect =
            await user.comparePassword(password);


        // Incorrect password
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // ----------------------------------------------------
        // 4. Check email verification
        // ----------------------------------------------------

        // A user must verify their email before logging in.
        if (!user.isEmailVerified) {
            return res.status(403).json({
                message:
                    "Please verify your email before logging in"
            });
        }


        // ----------------------------------------------------
        // 5. Generate JWT
        // ----------------------------------------------------

        // At this point:
        // - User exists
        // - Password is correct
        // - Email is verified
        //
        // So we can generate the authentication token.
        const token = generateToken(user);


        // ----------------------------------------------------
        // Send successful login email
        // ----------------------------------------------------

        try {

            await sendLoginSuccessEmail(
                user.email,
                user.name
            );

        } catch (emailError) {

            console.error(
                "Login email error:",
                emailError.message
            );

        }


        // ----------------------------------------------------
        // 6. Send successful login response
        // ----------------------------------------------------

        res.status(200).json({
            message: "Login successful",

            // JWT token will be used for future
            // authenticated requests.
            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    registerUser,
    verifyEmail,
    loginUser
};