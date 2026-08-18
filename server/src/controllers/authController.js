// ============================================================
// IMPORT MODELS
// ============================================================

const mongoose = require("mongoose");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const PasswordReset = require("../models/PasswordReset");


// ============================================================
// IMPORT UTILITIES
// ============================================================

const {
    generateOTP,
    hashOTP
} = require("../utils/generateOTP");

const {
    sendOTPEmail,
    sendWelcomeEmail,
    sendLoginSuccessEmail,
    sendPasswordResetOTPEmail
} = require("../utils/sendEmail");

const { generateToken } = require("../utils/jwt");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");


// ============================================================
// SECURITY CONSTANTS
// ============================================================

const MAX_OTP_ATTEMPTS = 5;
const RESET_OTP_COOLDOWN_MS = 60 * 1000;
const REGISTRATION_OTP_COOLDOWN_MS = 60 * 1000;
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const RESET_TOKEN_VALIDITY_MS = 10 * 60 * 1000;


const genericResetMessage =
    "If an account exists with this email, a password reset OTP has been sent.";


// ============================================================
// REGISTER USER
// ============================================================

const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password"
            });
        }


        const normalizedEmail = email.trim().toLowerCase();


        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }


        const existingUser = await User.findOne({
            email: normalizedEmail
        });


        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }


        const now = new Date();
        const cooldownCutoff = new Date(
            now.getTime() - REGISTRATION_OTP_COOLDOWN_MS
        );

        const passwordHash = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const expiresAt = new Date(
            now.getTime() + OTP_VALIDITY_MS
        );


        // Atomically reuse an expired registration or create one.
        // A still-active registration cannot be replaced during the
        // cooldown window, preventing registration-email abuse/races.
        let pendingRegistration;

        try {

            pendingRegistration =
                await PendingRegistration.findOneAndUpdate(
                    {
                        email: normalizedEmail,
                        $or: [
                            { expiresAt: { $lte: now } },
                            { expiresAt: { $exists: false } },
                            { otpSentAt: { $lte: cooldownCutoff } }
                        ]
                    },
                    {
                        $set: {
                            name: name.trim(),
                            email: normalizedEmail,
                            passwordHash,
                            otpHash,
                            expiresAt,
                            otpAttempts: 0,
                            otpSentAt: now
                        }
                    },
                    {
                        returnDocument: "after",
                        upsert: true,
                        runValidators: true,
                        setDefaultsOnInsert: true
                    }
                );

        } catch (error) {

            if (error.code === 11000) {
                return res.status(429).json({
                    message:
                        "A verification OTP was recently sent. Please wait before requesting another one."
                });
            }

            throw error;
        }


        try {

            await sendOTPEmail(
                normalizedEmail,
                otp
            );

        } catch (emailError) {

            await PendingRegistration.deleteOne({
                _id: pendingRegistration._id
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

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// VERIFY EMAIL
// ============================================================

const verifyEmail = async (req, res) => {

    try {

        const { pendingRegistrationId, otp } = req.body;


        if (!pendingRegistrationId || !otp) {
            return res.status(400).json({
                message: "Registration ID and OTP are required"
            });
        }


        if (!mongoose.Types.ObjectId.isValid(pendingRegistrationId)) {
            return res.status(400).json({
                message: "Invalid registration ID"
            });
        }


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


        const now = new Date();


        if (pendingRegistration.expiresAt <= now) {

            await PendingRegistration.deleteOne({
                _id: pendingRegistration._id
            });

            return res.status(400).json({
                message: "OTP has expired. Please register again."
            });
        }


        if (pendingRegistration.otpAttempts >= MAX_OTP_ATTEMPTS) {

            await PendingRegistration.deleteOne({
                _id: pendingRegistration._id
            });

            return res.status(429).json({
                message:
                    "Too many incorrect OTP attempts. Please register again."
            });
        }


        const isOtpCorrect =
            hashOTP(otp) === pendingRegistration.otpHash;


        if (!isOtpCorrect) {

            const updatedRegistration =
                await PendingRegistration.findOneAndUpdate(
                    {
                        _id: pendingRegistration._id,
                        otpAttempts: { $lt: MAX_OTP_ATTEMPTS }
                    },
                    {
                        $inc: { otpAttempts: 1 }
                    },
                    { returnDocument: "after" }
                );


            if (
                updatedRegistration &&
                updatedRegistration.otpAttempts >= MAX_OTP_ATTEMPTS
            ) {
                await PendingRegistration.deleteOne({
                    _id: pendingRegistration._id
                });

                return res.status(429).json({
                    message:
                        "Too many incorrect OTP attempts. Please register again."
                });
            }


            return res.status(400).json({
                message: "Invalid OTP"
            });
        }


        // Atomically consume the pending registration so two
        // simultaneous correct OTP requests cannot create two users.
        const consumedRegistration =
            await PendingRegistration.findOneAndDelete({
                _id: pendingRegistration._id,
                otpHash: pendingRegistration.otpHash,
                expiresAt: { $gt: now },
                otpAttempts: { $lt: MAX_OTP_ATTEMPTS }
            });


        if (!consumedRegistration) {
            return res.status(400).json({
                message:
                    "Registration verification has already been completed or is no longer valid."
            });
        }


        const existingUser = await User.findOne({
            email: consumedRegistration.email
        });


        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }


        const user = new User({
            name: consumedRegistration.name,
            email: consumedRegistration.email,
            password: consumedRegistration.passwordHash,
            role: "customer",
            isEmailVerified: true,
            isActive: true
        });

        user.$locals.passwordAlreadyHashed = true;

        try {
            await user.save();
        } catch (error) {

            if (error.code === 11000) {
                return res.status(400).json({
                    message: "User with this email already exists"
                });
            }

            throw error;
        }


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
            message: "Server error"
        });
    }
};


// ============================================================
// LOGIN USER
// ============================================================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }


        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });


        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        const isPasswordCorrect =
            await user.comparePassword(password);


        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        if (!user.isEmailVerified) {
            return res.status(403).json({
                message:
                    "Please verify your email before logging in"
            });
        }


        if (!user.isActive) {
            return res.status(403).json({
                message:
                    "Your account is inactive. Please contact support."
            });
        }


        const token = generateToken(user);


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


        return res.status(200).json({
            message: "Login successful",
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

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// FORGOT PASSWORD - SEND OTP
// ============================================================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;


        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }


        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });


        // Keep account enumeration protection.
        if (!user) {
            return res.status(200).json({
                message: genericResetMessage
            });
        }


        const now = new Date();
        const cooldownCutoff = new Date(
            now.getTime() - RESET_OTP_COOLDOWN_MS
        );

        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const expiresAt = new Date(
            now.getTime() + OTP_VALIDITY_MS
        );


        let resetRequest;

        try {

            // This is an atomic upsert. If an existing request is still
            // inside the cooldown window, the unique email index prevents
            // a second request from replacing it during a race.
            resetRequest =
                await PasswordReset.findOneAndUpdate(
                    {
                        email: normalizedEmail,
                        $or: [
                            { otpSentAt: { $lte: cooldownCutoff } },
                            { otpSentAt: { $exists: false } }
                        ]
                    },
                    {
                        $set: {
                            user: user._id,
                            email: normalizedEmail,
                            otpHash,
                            expiresAt,
                            otpAttempts: 0,
                            otpSentAt: now,
                            otpVerified: false,
                            verifiedAt: null,
                            resetTokenHash: null,
                            resetTokenExpiresAt: null
                        }
                    },
                    {
                        returnDocument: "after",
                        upsert: true,
                        runValidators: true,
                        setDefaultsOnInsert: true
                    }
                );

        } catch (error) {

            if (error.code === 11000) {
                return res.status(200).json({
                    message: genericResetMessage
                });
            }

            throw error;
        }


        try {

            await sendPasswordResetOTPEmail(
                normalizedEmail,
                otp,
                user.name
            );

        } catch (emailError) {

            // Invalidate the just-created request if the email could
            // not be delivered. This cannot remove a newer request
            // because the cooldown makes this request the only writer.
            await PasswordReset.deleteOne({
                _id: resetRequest._id
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


        return res.status(200).json({
            message: genericResetMessage
        });

    } catch (error) {

        console.error(
            "Forgot password error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// VERIFY PASSWORD RESET OTP
// ============================================================

const verifyPasswordResetOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;


        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }


        const normalizedEmail = email.trim().toLowerCase();

        const resetRequest = await PasswordReset.findOne({
            email: normalizedEmail
        });


        if (!resetRequest) {
            return res.status(400).json({
                message:
                    "Password reset request not found or expired."
            });
        }


        const now = new Date();


        if (resetRequest.expiresAt <= now) {

            await PasswordReset.deleteOne({
                _id: resetRequest._id
            });

            return res.status(400).json({
                message:
                    "OTP has expired. Please request a new OTP."
            });
        }


        if (resetRequest.otpVerified) {
            return res.status(400).json({
                message:
                    "This OTP has already been verified."
            });
        }


        if (resetRequest.otpAttempts >= MAX_OTP_ATTEMPTS) {

            await PasswordReset.deleteOne({
                _id: resetRequest._id
            });

            return res.status(429).json({
                message:
                    "Too many incorrect OTP attempts. Please request a new OTP."
            });
        }


        const isOtpCorrect =
            hashOTP(otp) === resetRequest.otpHash;


        if (!isOtpCorrect) {

            const updatedRequest =
                await PasswordReset.findOneAndUpdate(
                    {
                        _id: resetRequest._id,
                        otpVerified: false,
                        otpAttempts: { $lt: MAX_OTP_ATTEMPTS }
                    },
                    {
                        $inc: { otpAttempts: 1 }
                    },
                    { returnDocument: "after" }
                );


            if (
                updatedRequest &&
                updatedRequest.otpAttempts >= MAX_OTP_ATTEMPTS
            ) {
                await PasswordReset.deleteOne({
                    _id: resetRequest._id
                });

                return res.status(429).json({
                    message:
                        "Too many incorrect OTP attempts. Please request a new OTP."
                });
            }


            return res.status(400).json({
                message: "Invalid OTP"
            });
        }


        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


        // Atomically transition the request from OTP-valid to
        // password-reset-valid so the OTP cannot be verified twice.
        const verifiedRequest =
            await PasswordReset.findOneAndUpdate(
                {
                    _id: resetRequest._id,
                    otpHash: resetRequest.otpHash,
                    otpVerified: false,
                    expiresAt: { $gt: now },
                    otpAttempts: { $lt: MAX_OTP_ATTEMPTS }
                },
                {
                    $set: {
                        resetTokenHash,
                        resetTokenExpiresAt: new Date(
                            now.getTime() + RESET_TOKEN_VALIDITY_MS
                        ),
                        otpVerified: true,
                        verifiedAt: now
                    }
                },
                { returnDocument: "after" }
            );


        if (!verifiedRequest) {
            return res.status(400).json({
                message:
                    "OTP verification session is no longer valid."
            });
        }


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
            message: "Server error"
        });
    }
};


// ============================================================
// RESET PASSWORD
// ============================================================

const resetPassword = async (req, res) => {

    try {

        const { email, resetToken, newPassword } = req.body;


        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({
                message:
                    "Email, reset token and new password are required"
            });
        }


        if (newPassword.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters long"
            });
        }


        if (!/^[a-f0-9]{64}$/i.test(resetToken)) {
            return res.status(400).json({
                message: "Invalid or expired password reset session."
            });
        }


        const normalizedEmail = email.trim().toLowerCase();

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


        const resetRequest = await PasswordReset.findOne({
            email: normalizedEmail,
            resetTokenHash,
            otpVerified: true
        });


        if (!resetRequest) {
            return res.status(400).json({
                message:
                    "Invalid or expired password reset session."
            });
        }


        if (
            !resetRequest.resetTokenExpiresAt ||
            resetRequest.resetTokenExpiresAt <= new Date()
        ) {

            await PasswordReset.deleteOne({
                _id: resetRequest._id
            });

            return res.status(400).json({
                message:
                    "Password reset session has expired. Please request a new OTP."
            });
        }


        const user = await User.findById(resetRequest.user);


        if (!user) {

            await PasswordReset.deleteOne({
                _id: resetRequest._id
            });

            return res.status(404).json({
                message: "User account not found."
            });
        }


        user.password = newPassword;

        // User.pre("save") hashes the new password and increments
        // sessionVersion, invalidating all previously issued JWTs.
        await user.save();


        await PasswordReset.deleteOne({
            _id: resetRequest._id
        });


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
            message: "Server error"
        });
    }
};


// ============================================================
// LOGOUT USER
// ============================================================

const logoutUser = async (req, res) => {

    try {

        // Incrementing the session version immediately invalidates
        // the current JWT and every other JWT issued before it.
        await User.updateOne(
            { _id: req.user._id },
            { $inc: { sessionVersion: 1 } }
        );

        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {

        console.error(
            "Logout error:",
            error.message
        );

        return res.status(500).json({
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
    loginUser,
    forgotPassword,
    verifyPasswordResetOtp,
    resetPassword,
    logoutUser
};
