import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {

    const navigate =
        useNavigate();


    // ============================================================
    // STEP
    // ============================================================

    const [step, setStep] =
        useState(1);


    // ============================================================
    // FORM STATE
    // ============================================================

    const [email, setEmail] =
        useState("");

    const [otp, setOtp] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");


    // ============================================================
    // RESET TOKEN
    // ============================================================

    const [resetToken, setResetToken] =
        useState("");


    // ============================================================
    // MESSAGE STATE
    // ============================================================

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    // ============================================================
    // LOADING STATE
    // ============================================================

    const [loading, setLoading] =
        useState(false);


    // ============================================================
    // SEND OTP
    // ============================================================

    const handleSendOtp =
        async (event) => {

            event.preventDefault();

            setMessage("");

            setError("");


            if (!email.trim()) {

                setError(
                    "Please enter your email."
                );

                return;

            }


            try {

                setLoading(true);


                const normalizedEmail =
                    email
                        .trim()
                        .toLowerCase();


                const response =
                    await fetch(

                        "http://localhost:5000/api/auth/forgot-password",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        normalizedEmail

                                })

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(

                        data.message ||
                        "Unable to send OTP."

                    );

                    return;

                }


                setEmail(
                    normalizedEmail
                );


                setStep(2);


                setMessage(
                    data.message
                );

            } catch (error) {

                console.error(

                    "Forgot password error:",

                    error

                );


                setError(
                    "Unable to connect to server."
                );

            } finally {

                setLoading(false);

            }

        };


    // ============================================================
    // VERIFY OTP
    // ============================================================

    const handleVerifyOtp =
        async (event) => {

            event.preventDefault();

            setMessage("");

            setError("");


            if (
                otp.length !== 6
            ) {

                setError(
                    "Please enter the complete 6-digit OTP."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await fetch(

                        "http://localhost:5000/api/auth/verify-password-reset-otp",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email.trim(),

                                    otp

                                })

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(

                        data.message ||
                        "OTP verification failed."

                    );

                    return;

                }


                setResetToken(
                    data.resetToken
                );


                setOtp("");


                setStep(3);


                setMessage(
                    data.message
                );

            } catch (error) {

                console.error(

                    "OTP verification error:",

                    error

                );


                setError(
                    "Unable to connect to server."
                );

            } finally {

                setLoading(false);

            }

        };


    // ============================================================
    // RESET PASSWORD
    // ============================================================

    const handleResetPassword =
        async (event) => {

            event.preventDefault();

            setMessage("");

            setError("");


            if (
                !newPassword ||
                !confirmPassword
            ) {

                setError(
                    "Please fill in both password fields."
                );

                return;

            }


            if (
                newPassword.length < 6
            ) {

                setError(
                    "Password must be at least 6 characters long."
                );

                return;

            }


            if (
                newPassword !==
                confirmPassword
            ) {

                setError(
                    "Passwords do not match."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await fetch(

                        "http://localhost:5000/api/auth/reset-password",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email.trim(),

                                    resetToken,

                                    newPassword

                                })

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(

                        data.message ||
                        "Unable to reset password."

                    );

                    return;

                }


                setMessage(
                    data.message
                );


                setNewPassword("");

                setConfirmPassword("");


                setTimeout(() => {

                    navigate("/login");

                }, 1500);

            } catch (error) {

                console.error(

                    "Reset password error:",

                    error

                );


                setError(
                    "Unable to connect to server."
                );

            } finally {

                setLoading(false);

            }

        };


    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="login-page">

            <div className="login-card">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="login-header">

                    <h2>
                        Forgot Password?
                    </h2>

                    <p>
                        Reset your PaisaVasool account password securely.
                    </p>

                </div>


                {/* ==================================================
                    STEP 1 - EMAIL
                ================================================== */}

                {step === 1 && (

                    <form
                        onSubmit={handleSendOtp}
                        className="login-form"
                    >

                        <div className="login-field">

                            <label htmlFor="forgot-email">
                                Email
                            </label>

                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your email"
                                autoComplete="off"
                                required
                            />

                        </div>


                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Sending OTP..."
                                : "Send OTP"}

                        </button>

                    </form>

                )}


                {/* ==================================================
                    STEP 2 - OTP
                ================================================== */}

                {step === 2 && (

                    <form
                        onSubmit={handleVerifyOtp}
                        className="login-form"
                    >

                        <div className="login-field">

                            <label htmlFor="reset-otp">
                                Verification OTP
                            </label>

                            <input
                                id="reset-otp"
                                type="text"
                                inputMode="numeric"
                                value={otp}
                                onChange={(event) => {

                                    const value =
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6);

                                    setOtp(value);

                                }}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                autoComplete="one-time-code"
                                required
                            />

                        </div>


                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Verifying..."
                                : "Verify OTP"}

                        </button>

                    </form>

                )}


                {/* ==================================================
                    STEP 3 - NEW PASSWORD
                ================================================== */}

                {step === 3 && (

                    <form
                        onSubmit={handleResetPassword}
                        className="login-form"
                    >

                        <div className="login-field">

                            <label htmlFor="new-password">
                                New Password
                            </label>

                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                required
                            />

                        </div>


                        <div className="login-field">

                            <label htmlFor="confirm-password">
                                Confirm Password
                            </label>

                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                required
                            />

                        </div>


                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Updating Password..."
                                : "Update Password"}

                        </button>

                    </form>

                )}


                {/* ==================================================
                    SUCCESS MESSAGE
                ================================================== */}

                {message && (

                    <p className="login-message">

                        {message}

                    </p>

                )}


                {/* ==================================================
                    ERROR MESSAGE
                ================================================== */}

                {error && (

                    <p className="login-message login-error">

                        {error}

                    </p>

                )}


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="login-footer">

                    <p>

                        Remember your password?{" "}

                        <Link to="/login">
                            Login
                        </Link>

                    </p>

                </div>


            </div>

        </div>

    );

}


export default ForgotPassword;