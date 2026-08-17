import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate =
        useNavigate();


    // ============================================================
    // LOGIN FORM STATE
    // ============================================================

    const [formData, setFormData] =
        useState({

            email: "",

            password: ""

        });


    // ============================================================
    // FORGOT PASSWORD STATE
    // ============================================================

    const [showForgotPassword, setShowForgotPassword] =
        useState(false);

    const [forgotStep, setForgotStep] =
        useState("email");

    const [forgotEmail, setForgotEmail] =
        useState("");

    const [otp, setOtp] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

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

    const [forgotLoading, setForgotLoading] =
        useState(false);


    // ============================================================
    // HANDLE LOGIN INPUT
    // ============================================================

    const handleChange =
        (event) => {

            setFormData({

                ...formData,

                [event.target.name]:
                    event.target.value

            });

        };


    // ============================================================
    // HANDLE LOGIN
    // ============================================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();

            setMessage("");

            setError("");

            setLoading(true);


            try {

                const response =
                    await fetch(

                        "http://localhost:5000/api/auth/login",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    formData
                                )

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(

                        data.message ||
                        "Login failed"

                    );

                    return;

                }


                // ------------------------------------------------
                // SAVE TOKEN
                // ------------------------------------------------

                localStorage.setItem(

                    "token",

                    data.token

                );


                // ------------------------------------------------
                // SAVE USER
                // ------------------------------------------------

                localStorage.setItem(

                    "user",

                    JSON.stringify(
                        data.user
                    )

                );


                setMessage(
                    "Login successful!"
                );


                // ------------------------------------------------
                // GO HOME
                // ------------------------------------------------

                navigate("/");


            } catch (error) {

                console.error(

                    "Login error:",

                    error

                );


                setError(
                    "Unable to connect to server"
                );

            } finally {

                setLoading(false);

            }

        };


    // ============================================================
    // OPEN FORGOT PASSWORD
    // ============================================================

    const handleForgotPasswordOpen =
        () => {

            setShowForgotPassword(true);

            setForgotStep("email");

            setForgotEmail(
                formData.email
            );

            setOtp("");

            setNewPassword("");

            setConfirmPassword("");

            setResetToken("");

            setMessage("");

            setError("");

        };


    // ============================================================
    // CLOSE FORGOT PASSWORD
    // ============================================================

    const handleForgotPasswordClose =
        () => {

            setShowForgotPassword(false);

            setForgotStep("email");

            setForgotEmail("");

            setOtp("");

            setNewPassword("");

            setConfirmPassword("");

            setResetToken("");

            setMessage("");

            setError("");

        };


    // ============================================================
    // SEND PASSWORD RESET OTP
    // ============================================================

    const handleSendResetOtp =
        async (event) => {

            event.preventDefault();

            setMessage("");

            setError("");


            if (!forgotEmail.trim()) {

                setError(
                    "Please enter your email address."
                );

                return;

            }


            setForgotLoading(true);


            try {

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
                                        forgotEmail
                                            .trim()
                                            .toLowerCase()

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


                // ------------------------------------------------
                // Move to OTP step
                // ------------------------------------------------

                setForgotStep("otp");


                setMessage(
                    data.message ||
                    "If an account exists with this email, a password reset OTP has been sent."
                );


            } catch (error) {

                console.error(

                    "Forgot password error:",

                    error

                );


                setError(
                    "Unable to connect to server"
                );

            } finally {

                setForgotLoading(false);

            }

        };


    // ============================================================
    // HANDLE OTP INPUT
    // ============================================================

    const handleOtpChange =
        (event) => {

            const value =
                event.target.value

                    .replace(/\D/g, "")

                    .slice(0, 6);


            setOtp(value);

        };


    // ============================================================
    // VERIFY PASSWORD RESET OTP
    // ============================================================

    const handleVerifyResetOtp =
        async (event) => {

            event.preventDefault();

            setMessage("");

            setError("");


            if (otp.length !== 6) {

                setError(
                    "Please enter the complete 6-digit OTP."
                );

                return;

            }


            setForgotLoading(true);


            try {

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
                                        forgotEmail
                                            .trim()
                                            .toLowerCase(),

                                    otp

                                })

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(

                        data.message ||
                        "Invalid OTP."

                    );

                    return;

                }


                // ------------------------------------------------
                // Store reset token
                // ------------------------------------------------

                if (!data.resetToken) {

                    setError(
                        "Reset token was not received from the server."
                    );

                    return;

                }


                setResetToken(
                    data.resetToken
                );


                // ------------------------------------------------
                // Move to password step
                // ------------------------------------------------

                setForgotStep("password");


                setOtp("");


                setMessage(
                    "OTP verified successfully. Create your new password."
                );


            } catch (error) {

                console.error(

                    "Reset OTP verification error:",

                    error

                );


                setError(
                    "Unable to connect to server"
                );

            } finally {

                setForgotLoading(false);

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


            // ------------------------------------------------
            // Validate password fields
            // ------------------------------------------------

            if (
                !newPassword ||
                !confirmPassword
            ) {

                setError(
                    "Please fill in both password fields."
                );

                return;

            }


            // ------------------------------------------------
            // Password length
            // ------------------------------------------------

            if (
                newPassword.length < 6
            ) {

                setError(
                    "Password must be at least 6 characters long."
                );

                return;

            }


            // ------------------------------------------------
            // Password confirmation
            // ------------------------------------------------

            if (
                newPassword !==
                confirmPassword
            ) {

                setError(
                    "Passwords do not match."
                );

                return;

            }


            // ------------------------------------------------
            // Make sure reset token exists
            // ------------------------------------------------

            if (!resetToken) {

                setError(
                    "Password reset session is invalid. Please request a new OTP."
                );

                return;

            }


            setForgotLoading(true);


            try {

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
                                        forgotEmail
                                            .trim()
                                            .toLowerCase(),

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


                // ------------------------------------------------
                // Save email for login
                // ------------------------------------------------

                const resetEmail =
                    forgotEmail
                        .trim()
                        .toLowerCase();


                // ------------------------------------------------
                // Reset forgot-password state
                // ------------------------------------------------

                setShowForgotPassword(false);

                setForgotStep("email");

                setForgotEmail("");

                setOtp("");

                setNewPassword("");

                setConfirmPassword("");

                setResetToken("");


                // ------------------------------------------------
                // Put email back into login form
                // ------------------------------------------------

                setFormData({

                    email:
                        resetEmail,

                    password:
                        ""

                });


                setMessage(

                    data.message ||
                    "Password reset successfully. You can now login with your new password."

                );


            } catch (error) {

                console.error(

                    "Reset password error:",

                    error

                );


                setError(
                    "Unable to connect to server"
                );

            } finally {

                setForgotLoading(false);

            }

        };


    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="login-page">

            <div className="login-card">


                {/* ==================================================
                    NORMAL LOGIN
                ================================================== */}

                {!showForgotPassword && (

                    <>

                        <div className="login-header">

                            <h2>
                                Welcome Back :)
                            </h2>

                            <p>
                                Login to your PaisaVasool account.
                            </p>

                        </div>


                        {/* ==================================================
                            LOGIN FORM
                        ================================================== */}

                        <form
                            onSubmit={handleSubmit}
                            className="login-form"
                        >


                            {/* EMAIL */}

                            <div className="login-field">

                                <label htmlFor="login-email">
                                    Email
                                </label>

                                <input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="login-field">

                                <label htmlFor="login-password">
                                    Password
                                </label>

                                <input
                                    id="login-password"
                                    type="password"
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />

                            </div>


                            {/* FORGOT PASSWORD */}

                            <div className="login-forgot-wrapper">

                                <button
                                    type="button"
                                    className="login-forgot-button"
                                    onClick={
                                        handleForgotPasswordOpen
                                    }
                                >
                                    Forgot Password?
                                </button>

                            </div>


                            {/* LOGIN BUTTON */}

                            <button
                                type="submit"
                                className="login-button"
                                disabled={loading}
                            >

                                {loading
                                    ? "Logging in..."
                                    : "Login"}

                            </button>


                        </form>


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

                                Don't have an account?{" "}

                                <Link to="/register">
                                    Create an account
                                </Link>

                            </p>

                        </div>

                    </>

                )}


                {/* ==================================================
                    FORGOT PASSWORD
                ================================================== */}

                {showForgotPassword && (

                    <div className="login-forgot-section">


                        {/* ==================================================
                            STEP 1 - EMAIL
                        ================================================== */}

                        {forgotStep === "email" && (

                            <>

                                <div className="login-header">

                                    <h2>
                                        Forgot Password?
                                    </h2>

                                    <p>
                                        Enter your registered email and we'll send you a verification OTP.
                                    </p>

                                </div>


                                <form
                                    onSubmit={
                                        handleSendResetOtp
                                    }
                                    className="login-form"
                                >

                                    <div className="login-field">

                                        <label htmlFor="forgot-email">
                                            Email
                                        </label>

                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={
                                                forgotEmail
                                            }
                                            onChange={
                                                (event) =>
                                                    setForgotEmail(
                                                        event.target.value
                                                    )
                                            }
                                            placeholder="Enter your registered email"
                                            autoComplete="email"
                                            required
                                        />

                                    </div>


                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={
                                            forgotLoading
                                        }
                                    >

                                        {forgotLoading
                                            ? "Sending OTP..."
                                            : "Send OTP"}

                                    </button>

                                </form>

                            </>

                        )}


                        {/* ==================================================
                            STEP 2 - OTP
                        ================================================== */}

                        {forgotStep === "otp" && (

                            <>

                                <div className="login-header">

                                    <h2>
                                        Verify Your Email
                                    </h2>

                                    <p>
                                        Enter the 6-digit OTP sent to:
                                        <strong>
                                            {" "}
                                            {forgotEmail}
                                        </strong>
                                    </p>

                                </div>


                                <form
                                    onSubmit={
                                        handleVerifyResetOtp
                                    }
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
                                            onChange={
                                                handleOtpChange
                                            }
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            autoComplete="one-time-code"
                                            required
                                        />

                                    </div>


                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={
                                            forgotLoading
                                        }
                                    >

                                        {forgotLoading
                                            ? "Verifying..."
                                            : "Verify OTP"}

                                    </button>

                                </form>

                            </>

                        )}


                        {/* ==================================================
                            STEP 3 - NEW PASSWORD
                        ================================================== */}

                        {forgotStep === "password" && (

                            <>

                                <div className="login-header">

                                    <h2>
                                        Create New Password
                                    </h2>

                                    <p>
                                        Your email has been verified. Create a new password for your account.
                                    </p>

                                </div>


                                <form
                                    onSubmit={
                                        handleResetPassword
                                    }
                                    className="login-form"
                                >

                                    {/* NEW PASSWORD */}

                                    <div className="login-field">

                                        <label htmlFor="new-password">
                                            New Password
                                        </label>

                                        <input
                                            id="new-password"
                                            type="password"
                                            value={
                                                newPassword
                                            }
                                            onChange={
                                                (event) =>
                                                    setNewPassword(
                                                        event.target.value
                                                    )
                                            }
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                            required
                                        />

                                    </div>


                                    {/* CONFIRM PASSWORD */}

                                    <div className="login-field">

                                        <label htmlFor="confirm-new-password">
                                            Confirm New Password
                                        </label>

                                        <input
                                            id="confirm-new-password"
                                            type="password"
                                            value={
                                                confirmPassword
                                            }
                                            onChange={
                                                (event) =>
                                                    setConfirmPassword(
                                                        event.target.value
                                                    )
                                            }
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            required
                                        />

                                    </div>


                                    {/* UPDATE PASSWORD */}

                                    <button
                                        type="submit"
                                        className="login-button"
                                        disabled={
                                            forgotLoading
                                        }
                                    >

                                        {forgotLoading
                                            ? "Updating Password..."
                                            : "Update Password"}

                                    </button>

                                </form>

                            </>

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
                            BACK TO LOGIN
                        ================================================== */}

                        <div className="login-footer">

                            <button
                                type="button"
                                onClick={
                                    handleForgotPasswordClose
                                }
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    fontSize: "inherit"
                                }}
                            >

                                ← Back to Login

                            </button>

                        </div>


                    </div>

                )}


            </div>

        </div>

    );

}


export default Login;