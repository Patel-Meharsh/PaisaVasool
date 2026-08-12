import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Profile() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: ""
    });


    // ============================================================
    // FETCH PROFILE
    // ============================================================

    const fetchProfile = async () => {

        try {

            setLoading(true);

            setError("");

            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(
                "http://localhost:5000/api/profile",
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch profile"
                );

            }


            setProfile(data.user);

            setFormData({
                name: data.user?.name || "",
                email: data.user?.email || ""
            });


        } catch (error) {

            console.error(
                "Fetch profile error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LOAD PROFILE
    // ============================================================

    useEffect(() => {

        fetchProfile();

    }, []);


    // ============================================================
    // HANDLE INPUT
    // ============================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setFormData((previousData) => ({

            ...previousData,

            [name]: value

        }));

    };


    // ============================================================
    // UPDATE PROFILE
    // ============================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        if (!formData.name.trim()) {

            setError(
                "Name is required."
            );

            return;

        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(
                "http://localhost:5000/api/profile",
                {
                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        name:
                            formData.name.trim()

                    })

                }
            );


            // ----------------------------------------------------
            // Read response safely
            // ----------------------------------------------------

            const contentType =
                response.headers.get(
                    "content-type"
                );


            let data;


            if (
                contentType &&
                contentType.includes("application/json")
            ) {

                data =
                    await response.json();

            } else {

                const text =
                    await response.text();

                console.error(
                    "Profile update returned non-JSON:",
                    text
                );

                throw new Error(
                    `Profile update failed (${response.status})`
                );

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update profile"
                );

            }


            // ----------------------------------------------------
            // Update UI with backend response
            // ----------------------------------------------------

            setProfile(data.user);


            setFormData({

                name:
                    data.user?.name || "",

                email:
                    data.user?.email || ""

            });


            setSuccess(
                "Profile updated successfully."
            );


        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setSaving(false);

        }

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div>

                <h2>
                    Loading profile...
                </h2>

            </div>

        );

    }


    // ============================================================
    // UI
    // ============================================================

    return (

        <div>

            <Link to="/">
                ← Back to Home
            </Link>


            <h1>
                My Profile
            </h1>


            <p>
                Manage your PaisaVasool account information.
            </p>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <p>
                    {error}
                </p>

            )}


            {/* ==================================================
                SUCCESS
            ================================================== */}

            {success && (

                <p>
                    {success}
                </p>

            )}


            {/* ==================================================
                ACCOUNT INFORMATION
            ================================================== */}

            {profile && (

                <div>

                    <h2>
                        Account Information
                    </h2>


                    <p>
                        Account ID:{" "}
                        {profile._id}
                    </p>


                    <p>
                        Role:{" "}

                        <strong>
                            {profile.role}
                        </strong>

                    </p>


                    <p>
                        Email Verified:{" "}

                        <strong>

                            {profile.isEmailVerified
                                ? "Yes"
                                : "No"}

                        </strong>

                    </p>

                </div>

            )}


            {/* ==================================================
                EDIT PROFILE
            ================================================== */}

            <div>

                <h2>
                    Edit Profile
                </h2>


                <form
                    onSubmit={handleSubmit}
                >

                    {/* NAME */}

                    <div>

                        <label>
                            Name
                        </label>

                        <input

                            type="text"

                            name="name"

                            value={
                                formData.name
                            }

                            onChange={
                                handleChange
                            }

                            placeholder="Enter your name"

                        />

                    </div>


                    {/* EMAIL */}

                    <div>

                        <label>
                            Email
                        </label>

                        <input

                            type="email"

                            name="email"

                            value={
                                formData.email
                            }

                            disabled

                        />

                        <small>
                            Email cannot be changed.
                        </small>

                    </div>


                    {/* SAVE BUTTON */}

                    <button

                        type="submit"

                        disabled={saving}

                    >

                        {saving
                            ? "Saving..."
                            : "Save Changes"}

                    </button>

                </form>

            </div>

        </div>

    );

}


export default Profile;