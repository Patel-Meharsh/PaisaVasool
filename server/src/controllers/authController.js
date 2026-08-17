// ============================================================
// IMPORT MODELS
// ============================================================

// User model
const User =
    require("../models/User");

// Pending registration model
const PendingRegistration =
    require("../models/PendingRegistration");

// Password reset model
const PasswordReset =
    require("../models/PasswordReset");


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
    sendLoginSuccessEmail,
    sendPasswordResetOTPEmail
} = require("../utils/sendEmail");

// JWT utility
const {
    generateToken
} = require("../utils/jwt");

// Crypto utility
const crypto =
    require("crypto");

// bcrypt
const bcrypt =
    require("bcryptjs");


// ============================================================
// REGISTER USER
// ============================================================

const registerUser =
    async (req, res) => {

        try {

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

            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    message:
                        "Password must be at least 6 characters long"

                });

            }


            // ------------------------------------------------
            // Check whether a real user already exists
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
            // Remove old pending registration
            // ------------------------------------------------

            await PendingRegistration.deleteOne({

                email:
                    normalizedEmail

            });


            // ------------------------------------------------
            // Hash password before temporary storage
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
            // Create pending registration
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

                pendingRegistrationId:
                    pendingRegistration._id

            });

        } catch (error) {

            console.error(
                "Registration error:",
                error.message
            );


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

            const {
                pendingRegistrationId,
                otp
            } = req.body;


            // ------------------------------------------------
            // Validate input
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
            // Verify OTP
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
            // Check whether user already exists
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
            // Create real user
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


            // ------------------------------------------------
            // Prevent password from being hashed twice
            // ------------------------------------------------

            user.$locals.passwordAlreadyHashed =
                true;


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

                console.error(

                    "Welcome email error:",

                    emailError.message

                );

            }


            // ------------------------------------------------
            // Response
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

            const {
                email,
                password
            } = req.body;


            // ------------------------------------------------
            // Validate input
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
            // Check account status
            // ------------------------------------------------

            if (
                !user.isActive
            ) {

                return res.status(403).json({

                    message:
                        "Your account is inactive. Please contact support."

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
            // Response
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
// FORGOT PASSWORD - SEND OTP
// ============================================================

const forgotPassword =
    async (req, res) => {

        try {

            const {
                email
            } = req.body;


            // ------------------------------------------------
            // Validate email
            // ------------------------------------------------

            if (!email) {

                return res.status(400).json({

                    message:
                        "Email is required"

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


            // ------------------------------------------------
            // Do not reveal whether email exists
            // ------------------------------------------------

            if (!user) {

                return res.status(200).json({

                    message:
                        "If an account exists with this email, a password reset OTP has been sent."

                });

            }


            // ------------------------------------------------
            // Remove previous reset requests
            // ------------------------------------------------

            await PasswordReset.deleteMany({

                email:
                    normalizedEmail

            });


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
            // Create password reset request
            // ------------------------------------------------

            await PasswordReset.create({

                // IMPORTANT:
                // PasswordReset schema uses "user",
                // not "userId".

                user:
                    user._id,

                email:
                    normalizedEmail,

                otpHash,

                expiresAt,

                otpVerified:
                    false,

                verifiedAt:
                    null,

                resetTokenHash:
                    null,

                resetTokenExpiresAt:
                    null

            });


            // ------------------------------------------------
            // Send password reset OTP email
            // ------------------------------------------------

            try {

                await sendPasswordResetOTPEmail(

                    normalizedEmail,

                    otp,

                    user.name

                );

            } catch (emailError) {

                await PasswordReset.deleteMany({

                    email:
                        normalizedEmail

                });


                console.error(

                    "Password reset email error:",

                    emailError.message

                );


                return res.status(500).json({

                    message:
                        "Unable to send password reset email. Please try again."

                });

            }


            // ------------------------------------------------
            // Response
            // ------------------------------------------------

            return res.status(200).json({

                message:
                    "If an account exists with this email, a password reset OTP has been sent."

            });

        } catch (error) {

            console.error(

                "Forgot password error:",

                error.message

            );


            return res.status(500).json({

                message:
                    "Server error"

            });

        }

    };


// ============================================================
// VERIFY PASSWORD RESET OTP
// ============================================================

const verifyPasswordResetOtp =
    async (req, res) => {

        try {

            const {
                email,
                otp
            } = req.body;


            // ------------------------------------------------
            // Validate input
            // ------------------------------------------------

            if (
                !email ||
                !otp
            ) {

                return res.status(400).json({

                    message:
                        "Email and OTP are required"

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
            // Find password reset request
            // ------------------------------------------------

            const resetRequest =
                await PasswordReset.findOne({

                    email:
                        normalizedEmail

                });


            if (!resetRequest) {

                return res.status(400).json({

                    message:
                        "Password reset request not found or expired."

                });

            }


            // ------------------------------------------------
            // Check OTP expiration
            // ------------------------------------------------

            if (
                resetRequest.expiresAt <
                new Date()
            ) {

                await PasswordReset.deleteOne({

                    _id:
                        resetRequest._id

                });


                return res.status(400).json({

                    message:
                        "OTP has expired. Please request a new OTP."

                });

            }


            // ------------------------------------------------
            // Verify OTP
            // ------------------------------------------------

            const isOtpCorrect =
                hashOTP(otp) ===
                resetRequest.otpHash;


            if (!isOtpCorrect) {

                return res.status(400).json({

                    message:
                        "Invalid OTP"

                });

            }


            // ------------------------------------------------
            // Generate secure reset token
            // ------------------------------------------------

            const resetToken =
                crypto
                    .randomBytes(32)
                    .toString("hex");


            // ------------------------------------------------
            // Hash reset token before database storage
            // ------------------------------------------------

            const resetTokenHash =
                crypto
                    .createHash("sha256")
                    .update(resetToken)
                    .digest("hex");


            // ------------------------------------------------
            // Save verified reset state
            // ------------------------------------------------

            resetRequest.resetTokenHash =
                resetTokenHash;


            resetRequest.resetTokenExpiresAt =
                new Date(

                    Date.now() +
                    10 * 60 * 1000

                );


            resetRequest.otpVerified =
                true;


            resetRequest.verifiedAt =
                new Date();


            await resetRequest.save();


            // ------------------------------------------------
            // Response
            // ------------------------------------------------

            return res.status(200).json({

                message:
                    "OTP verified successfully. You can now create a new password.",

                resetToken

            });

        } catch (error) {

            console.error(

                "Password reset OTP verification error:",

                error.message

            );


            return res.status(500).json({

                message:
                    "Server error"

            });

        }

    };


// ============================================================
// RESET PASSWORD
// ============================================================

const resetPassword =
    async (req, res) => {

        try {

            const {
                email,
                resetToken,
                newPassword
            } = req.body;


            // ------------------------------------------------
            // Validate input
            // ------------------------------------------------

            if (
                !email ||
                !resetToken ||
                !newPassword
            ) {

                return res.status(400).json({

                    message:
                        "Email, reset token and new password are required"

                });

            }


            // ------------------------------------------------
            // Validate password length
            // ------------------------------------------------

            if (
                newPassword.length < 6
            ) {

                return res.status(400).json({

                    message:
                        "Password must be at least 6 characters long"

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
            // Hash reset token
            // ------------------------------------------------

            const resetTokenHash =
                crypto
                    .createHash("sha256")
                    .update(resetToken)
                    .digest("hex");


            // ------------------------------------------------
            // Find verified reset request
            // ------------------------------------------------

            const resetRequest =
                await PasswordReset.findOne({

                    email:
                        normalizedEmail,

                    resetTokenHash,

                    otpVerified:
                        true

                });


            if (!resetRequest) {

                return res.status(400).json({

                    message:
                        "Invalid or expired password reset session."

                });

            }


            // ------------------------------------------------
            // Check reset-token expiration
            // ------------------------------------------------

            if (
                !resetRequest.resetTokenExpiresAt ||
                resetRequest.resetTokenExpiresAt <
                new Date()
            ) {

                await PasswordReset.deleteOne({

                    _id:
                        resetRequest._id

                });


                return res.status(400).json({

                    message:
                        "Password reset session has expired. Please request a new OTP."

                });

            }


            // ------------------------------------------------
            // Find user
            // ------------------------------------------------

            const user =
                await User.findById(

                    resetRequest.user

                );


            if (!user) {

                await PasswordReset.deleteOne({

                    _id:
                        resetRequest._id

                });


                return res.status(404).json({

                    message:
                        "User account not found."

                });

            }


            // ------------------------------------------------
            // Update password
            // ------------------------------------------------

            user.password =
                newPassword;


            // ------------------------------------------------
            // Save user
            //
            // The User model's password middleware should
            // hash the new password before storing it.
            // ------------------------------------------------

            await user.save();


            // ------------------------------------------------
            // Delete used reset request
            // ------------------------------------------------

            await PasswordReset.deleteOne({

                _id:
                    resetRequest._id

            });


            // ------------------------------------------------
            // Response
            // ------------------------------------------------

            return res.status(200).json({

                message:
                    "Password reset successfully. You can now login with your new password."

            });

        } catch (error) {

            console.error(

                "Reset password error:",

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

    loginUser,

    forgotPassword,

    verifyPasswordResetOtp,

    resetPassword

};