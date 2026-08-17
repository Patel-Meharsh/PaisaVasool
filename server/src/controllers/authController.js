// ============================================================
// IMPORT MODELS
// ============================================================

// User model
const User =
    require("../models/User");

// Pending registration model
const PendingRegistration =
    require("../models/PendingRegistration");


// ============================================================
// IMPORT UTILITIES
// ============================================================

// OTP utilities
const {
    generateOTP,
    hashOTP
} = require("../utils/generateOTP");


// Email utilities
const {
    sendOTPEmail,
    sendWelcomeEmail,
    sendLoginSuccessEmail
} = require("../utils/sendEmail");


// JWT utility
const {
    generateToken
} = require("../utils/jwt");


// bcrypt
// Used to hash the password before putting it
// into PendingRegistration.
const bcrypt =
    require("bcryptjs");


// ============================================================
// REGISTER USER
// ============================================================

const registerUser =
    async (req, res) => {

        try {

            // ------------------------------------------------
            // Get registration data
            // ------------------------------------------------

            const {
                name,
                email,
                password
            } = req.body;


            // ------------------------------------------------
            // Validate required fields
            // ------------------------------------------------

            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Please provide name, email and password"

                });

            }


            // ------------------------------------------------
            // Normalize email
            // ------------------------------------------------

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            // ------------------------------------------------
            // Check password length
            // ------------------------------------------------

            if (password.length < 6) {

                return res.status(400).json({

                    message:
                        "Password must be at least 6 characters long"

                });

            }


            // ------------------------------------------------
            // Check whether a REAL user already exists
            // ------------------------------------------------

            const existingUser =
                await User.findOne({

                    email:
                        normalizedEmail

                });


            if (existingUser) {

                return res.status(400).json({

                    message:
                        "User with this email already exists"

                });

            }


            // ------------------------------------------------
            // If an old pending registration exists,
            // remove it so the user can register again.
            // ------------------------------------------------

            await PendingRegistration.deleteOne({

                email:
                    normalizedEmail

            });


            // ------------------------------------------------
            // Hash password BEFORE storing it temporarily
            // ------------------------------------------------

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            // ------------------------------------------------
            // Generate OTP
            // ------------------------------------------------

            const otp =
                generateOTP();


            // ------------------------------------------------
            // Hash OTP
            // ------------------------------------------------

            const otpHash =
                hashOTP(otp);


            // ------------------------------------------------
            // OTP expires after 5 minutes
            // ------------------------------------------------

            const expiresAt =
                new Date(
                    Date.now() +
                    5 * 60 * 1000
                );


            // ------------------------------------------------
            // Create PENDING registration
            // ------------------------------------------------
            //
            // IMPORTANT:
            // No User document is created here.
            //
            // Therefore an unverified registration
            // is NOT an account.
            // ------------------------------------------------

            const pendingRegistration =
                await PendingRegistration.create({

                    name:
                        name.trim(),

                    email:
                        normalizedEmail,

                    passwordHash,

                    otpHash,

                    expiresAt

                });


            // ------------------------------------------------
            // Send OTP
            // ------------------------------------------------

            try {

                await sendOTPEmail(
                    normalizedEmail,
                    otp
                );

            } catch (emailError) {

                // ------------------------------------------------
                // If email sending fails, remove the pending
                // registration so the user isn't left with
                // a useless registration record.
                // ------------------------------------------------

                await PendingRegistration.deleteOne({

                    _id:
                        pendingRegistration._id

                });


                console.error(
                    "Registration OTP email error:",
                    emailError.message
                );


                return res.status(500).json({

                    message:
                        "Unable to send verification email. Please try again."

                });

            }


            // ------------------------------------------------
            // Registration response
            // ------------------------------------------------

            return res.status(201).json({

                message:
                    "OTP sent successfully. Please verify your email to complete registration.",

                // IMPORTANT:
                // This is NOT a User ID.
                // It is a temporary registration ID.
                pendingRegistrationId:
                    pendingRegistration._id

            });

        } catch (error) {

            console.error(
                "Registration error:",
                error.message
            );


            // Handle duplicate pending email safely
            if (
                error.code === 11000
            ) {

                return res.status(400).json({

                    message:
                        "A registration for this email is already in progress. Please try again."

                });

            }


            return res.status(500).json({

                message:
                    "Server error"

            });

        }

    };


// ============================================================
// VERIFY EMAIL
// ============================================================

const verifyEmail =
    async (req, res) => {

        try {

            // ------------------------------------------------
            // Get temporary registration ID and OTP
            // ------------------------------------------------

            const {
                pendingRegistrationId,
                otp
            } = req.body;


            // ------------------------------------------------
            // Validate fields
            // ------------------------------------------------

            if (
                !pendingRegistrationId ||
                !otp
            ) {

                return res.status(400).json({

                    message:
                        "Registration ID and OTP are required"

                });

            }


            // ------------------------------------------------
            // Find pending registration
            // ------------------------------------------------

            const pendingRegistration =
                await PendingRegistration.findById(
                    pendingRegistrationId
                );


            // ------------------------------------------------
            // Pending registration doesn't exist
            // ------------------------------------------------

            if (!pendingRegistration) {

                return res.status(404).json({

                    message:
                        "Registration not found or expired. Please register again."

                });

            }


            // ------------------------------------------------
            // Check OTP expiration
            // ------------------------------------------------

            if (
                pendingRegistration.expiresAt <
                new Date()
            ) {

                // Delete expired pending registration
                await PendingRegistration.deleteOne({

                    _id:
                        pendingRegistration._id

                });


                return res.status(400).json({

                    message:
                        "OTP has expired. Please register again."

                });

            }


            // ------------------------------------------------
            // Compare OTP
            // ------------------------------------------------

            const isOtpCorrect =
                hashOTP(otp) ===
                pendingRegistration.otpHash;


            if (!isOtpCorrect) {

                return res.status(400).json({

                    message:
                        "Invalid OTP"

                });

            }


            // ------------------------------------------------
            // Check again whether the email was registered
            // while this verification was pending.
            // ------------------------------------------------

            const existingUser =
                await User.findOne({

                    email:
                        pendingRegistration.email

                });


            if (existingUser) {

                await PendingRegistration.deleteOne({

                    _id:
                        pendingRegistration._id

                });


                return res.status(400).json({

                    message:
                        "User with this email already exists"

                });

            }


            // ------------------------------------------------
            // Create REAL USER
            // ------------------------------------------------
            //
            // The password is already bcrypt hashed.
            //
            // We tell the User model not to hash it again.
            // ------------------------------------------------

            const user =
                new User({

                    name:
                        pendingRegistration.name,

                    email:
                        pendingRegistration.email,

                    password:
                        pendingRegistration.passwordHash,

                    role:
                        "customer",

                    isEmailVerified:
                        true,

                    isActive:
                        true

                });


            // Tell User.js that this password is already hashed.
            user.$locals.passwordAlreadyHashed = true;


            // Save actual User
            await user.save();


            // ------------------------------------------------
            // Delete pending registration
            // ------------------------------------------------

            await PendingRegistration.deleteOne({

                _id:
                    pendingRegistration._id

            });


            // ------------------------------------------------
            // Send welcome email
            // ------------------------------------------------

            try {

                await sendWelcomeEmail(

                    user.email,

                    user.name

                );

            } catch (emailError) {

                // Welcome email failure should NOT
                // invalidate successful registration.

                console.error(

                    "Welcome email error:",

                    emailError.message

                );

            }


            // ------------------------------------------------
            // Successful response
            // ------------------------------------------------

            return res.status(200).json({

                message:
                    "Email verified successfully. Your account has been created."

            });

        } catch (error) {

            console.error(

                "Email verification error:",

                error.message

            );


            return res.status(500).json({

                message:
                    "Server error"

            });

        }

    };


// ============================================================
// LOGIN USER
// ============================================================

const loginUser =
    async (req, res) => {

        try {

            // ------------------------------------------------
            // Get login information
            // ------------------------------------------------

            const {
                email,
                password
            } = req.body;


            // ------------------------------------------------
            // Validate required fields
            // ------------------------------------------------

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Email and password are required"

                });

            }


            // ------------------------------------------------
            // Normalize email
            // ------------------------------------------------

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            // ------------------------------------------------
            // Find user
            // ------------------------------------------------

            const user =
                await User.findOne({

                    email:
                        normalizedEmail

                });


            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            // ------------------------------------------------
            // Compare password
            // ------------------------------------------------

            const isPasswordCorrect =
                await user.comparePassword(
                    password
                );


            if (!isPasswordCorrect) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            // ------------------------------------------------
            // Check email verification
            // ------------------------------------------------

            if (
                !user.isEmailVerified
            ) {

                return res.status(403).json({

                    message:
                        "Please verify your email before logging in"

                });

            }


            // ------------------------------------------------
            // Generate JWT
            // ------------------------------------------------

            const token =
                generateToken(user);


            // ------------------------------------------------
            // Send login success email
            // ------------------------------------------------

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


            // ------------------------------------------------
            // Successful login response
            // ------------------------------------------------

            return res.status(200).json({

                message:
                    "Login successful",

                token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    role:
                        user.role

                }

            });

        } catch (error) {

            console.error(

                "Login error:",

                error.message

            );


            return res.status(500).json({

                message:
                    "Server error"

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