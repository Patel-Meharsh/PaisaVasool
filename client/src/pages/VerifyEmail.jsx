import { useState } from "react";
import { useNavigate } from "react-router-dom";

function VerifyEmail() {
    const navigate = useNavigate();

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        const userId = localStorage.getItem("verificationUserId");

        if (!userId) {
            setError("Verification session not found. Please register again.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/verify-email",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        userId,
                        otp
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Verification failed");
                return;
            }

            setMessage(data.message);

            // Verification is complete.
            localStorage.removeItem("verificationUserId");

            // Give the user a moment to see the message,
            // then move to login.
            setTimeout(() => {
                navigate("/login");
            }, 1000);

        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Verify Email</h2>

            <p>
                Enter the OTP sent to your email.
            </p>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>OTP</label>

                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength="6"
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Email"}
                </button>

            </form>

            {message && <p>{message}</p>}

            {error && <p>{error}</p>}

        </div>
    );
}
export default VerifyEmail;