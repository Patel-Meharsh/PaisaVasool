import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();


    // ============================================================
    // FORM STATE
    // ============================================================

    const [formData, setFormData] = useState({

        email: "",

        password: ""

    });


    // ============================================================
    // MESSAGE STATE
    // ============================================================

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);


    // ============================================================
    // HANDLE INPUT CHANGE
    // ============================================================

    const handleChange = (event) => {

        setFormData({

            ...formData,

            [event.target.name]:
                event.target.value

        });

    };


    // ============================================================
    // HANDLE LOGIN
    // ============================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage("");

        setError("");

        setLoading(true);


        try {

            const response = await fetch(

                "http://localhost:5000/api/auth/login",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(formData)

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


            // ----------------------------------------------------
            // SAVE JWT TOKEN
            // ----------------------------------------------------

            localStorage.setItem(
                "token",
                data.token
            );


            // ----------------------------------------------------
            // SAVE USER INFORMATION
            // ----------------------------------------------------

            localStorage.setItem(

                "user",

                JSON.stringify(
                    data.user
                )

            );


            setMessage(
                "Login successful!"
            );


            // ----------------------------------------------------
            // GO TO HOME PAGE
            // ----------------------------------------------------

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
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
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
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />

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


            </div>

        </div>

    );

}

export default Login;