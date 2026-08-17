import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {

    // ============================================================
    // REGISTRATION STATE
    // ============================================================

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });


    // ============================================================
    // OTP STATE
    // ============================================================

    const [otp, setOtp] = useState("");

    const [showOtpSection, setShowOtpSection] =
        useState(false);


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

    const [verifying, setVerifying] =
        useState(false);


    // ============================================================
    // HANDLE REGISTRATION INPUT
    // ============================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setFormData(
            (previousData) => ({

                ...previousData,

                [name]:
                    value

            })
        );

    };


    // ============================================================
    // HANDLE OTP INPUT
    // ============================================================

    const handleOtpChange = (event) => {

        const value =
            event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);


        setOtp(value);

    };


    // ============================================================
    // REGISTER USER
    // ============================================================

    const handleRegister = async (event) => {

        event.preventDefault();


        setMessage("");

        setError("");


        // --------------------------------------------------------
        // Do not allow registration again while OTP is active
        // --------------------------------------------------------

        if (showOtpSection) {

            return;

        }


        // --------------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------------

        if (!formData.name.trim()) {

            setError(
                "Name is required."
            );

            return;

        }


        if (!formData.email.trim()) {

            setError(
                "Email is required."
            );

            return;

        }


        if (!formData.password) {

            setError(
                "Password is required."
            );

            return;

        }


        setLoading(true);


        try {

            const response =
                await fetch(

                    "http://localhost:5000/api/auth/register",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name:
                                    formData.name.trim(),

                                email:
                                    formData.email.trim(),

                                password:
                                    formData.password

                            })

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                setError(
                    data.message ||
                    "Registration failed"
                );

                return;

            }


            // ----------------------------------------------------
            // Save pending registration ID
            //
            // IMPORTANT:
            // User is NOT created in the users collection yet.
            // This ID points to the temporary pending registration.
            // ----------------------------------------------------

            localStorage.setItem(
                "pendingRegistrationId",
                data.pendingRegistrationId
            );


            // ----------------------------------------------------
            // Show OTP section on the same page
            // ----------------------------------------------------

            setShowOtpSection(true);


            setMessage(
                "OTP has been sent to your email. Please verify your email to complete registration."
            );


        } catch (error) {

            console.error(
                "Registration error:",
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
    // VERIFY OTP
    // ============================================================

    const handleVerifyOtp = async (event) => {

        event.preventDefault();


        setMessage("");

        setError("");


        // --------------------------------------------------------
        // OTP VALIDATION
        // --------------------------------------------------------

        if (!otp) {

            setError(
                "Please enter the OTP."
            );

            return;

        }


        if (otp.length !== 6) {

            setError(
                "Please enter the complete 6-digit OTP."
            );

            return;

        }


        // --------------------------------------------------------
        // GET PENDING REGISTRATION ID
        // --------------------------------------------------------

        const pendingRegistrationId =
            localStorage.getItem(
                "pendingRegistrationId"
            );


        if (!pendingRegistrationId) {

            setError(
                "Registration session not found. Please register again."
            );

            setShowOtpSection(false);

            return;

        }


        setVerifying(true);


        try {

            const response =
                await fetch(

                    "http://localhost:5000/api/auth/verify-email",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                pendingRegistrationId,

                                otp

                            })

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                setError(
                    data.message ||
                    "Email verification failed"
                );

                return;

            }


            // ----------------------------------------------------
            // VERIFICATION SUCCESSFUL
            //
            // Backend should now:
            //
            // 1. Verify OTP
            // 2. Create the actual user
            // 3. Hash the password
            // 4. Save user in database
            // 5. Delete pending registration
            // ----------------------------------------------------

            localStorage.removeItem(
                "pendingRegistrationId"
            );


            setOtp("");


            setMessage(
                "Email verified successfully. You can now login to your account."
            );


            // ----------------------------------------------------
            // Hide OTP section
            // ----------------------------------------------------

            setShowOtpSection(false);


            // ----------------------------------------------------
            // Redirect to login after success message
            // ----------------------------------------------------

            setTimeout(() => {

                window.location.href =
                    "/login";

            }, 1500);


        } catch (error) {

            console.error(
                "Email verification error:",
                error
            );

            setError(
                "Unable to connect to server"
            );

        } finally {

            setVerifying(false);

        }

    };


    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="register-page">


            {/* ==================================================
                REGISTER CARD
            ================================================== */}

            <div className="register-card">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="register-header">

                    <h2>
                        Create Account !!
                    </h2>

                    <p>
                        Create your PaisaVasool account and start shopping.
                    </p>

                </div>


                {/* ==================================================
                    REGISTRATION FORM
                ================================================== */}

                <form
                    onSubmit={handleRegister}
                    className="register-form"
                    autoComplete="off"
                >


                    {/* NAME */}

                    <div className="register-field">

                        <label htmlFor="register-name">
                            Name
                        </label>

                        <input
                            id="register-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            autoComplete="off"
                            disabled={showOtpSection}
                            required
                        />

                    </div>


                    {/* EMAIL */}

                    <div className="register-field">

                        <label htmlFor="register-email">
                            Email
                        </label>

                        <input
                            id="register-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            autoComplete="off"
                            disabled={showOtpSection}
                            required
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="register-field">

                        <label htmlFor="register-password">
                            Password
                        </label>

                        <input
                            id="register-password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            disabled={showOtpSection}
                            required
                        />

                    </div>


                    {/* REGISTER BUTTON */}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={
                            loading ||
                            showOtpSection
                        }
                    >

                        {loading
                            ? "Creating Account..."
                            : "Register"}

                    </button>


                </form>


                {/* ==================================================
                    OTP VERIFICATION SECTION
                ================================================== */}

                {showOtpSection && (

                    <div className="register-otp-section">


                        <div className="register-otp-divider">
                        </div>


                        <div className="register-otp-header">

                            <h3>
                                Verify Your Email
                            </h3>

                            <p>
                                We've sent a 6-digit OTP to:
                                <strong>
                                    {" "}{formData.email}
                                </strong>
                            </p>

                        </div>


                        <form
                            onSubmit={handleVerifyOtp}
                            className="register-otp-form"
                            autoComplete="off"
                        >


                            <div className="register-field">

                                <label htmlFor="register-otp">
                                    Enter OTP
                                </label>

                                <input
                                    id="register-otp"
                                    type="text"
                                    inputMode="numeric"
                                    name="otp"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                    required
                                />

                            </div>


                            <button
                                type="submit"
                                className="register-verify-button"
                                disabled={
                                    verifying
                                }
                            >

                                {verifying
                                    ? "Verifying..."
                                    : "Verify Email"}

                            </button>


                        </form>


                        <p className="register-otp-note">

                            Check your inbox and enter the OTP
                            sent to your email address.

                        </p>


                    </div>

                )}


                {/* ==================================================
                    MESSAGE
                ================================================== */}

                {message && (

                    <div className="register-message">

                        {message}

                    </div>

                )}


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="register-message register-error">

                        {error}

                    </div>

                )}


                {/* ==================================================
                    FOOTER
                ================================================== */}

                {!showOtpSection && (

                    <div className="register-footer">

                        <p>

                            Already have an account?{" "}

                            <Link to="/login">
                                Login
                            </Link>

                        </p>

                    </div>

                )}


            </div>

        </div>

    );

}

export default Register;