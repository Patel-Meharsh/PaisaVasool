import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Profile() {

    const navigate =
        useNavigate();

    const fileInputRef =
        useRef(null);


    // ============================================================
    // PROFILE STATE
    // ============================================================

    const [profile, setProfile] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [uploadingPicture, setUploadingPicture] =
        useState(false);

    const [removingPicture, setRemovingPicture] =
        useState(false);


    // ============================================================
    // MESSAGE STATE
    // ============================================================

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ============================================================
    // PROFILE FORM
    // ============================================================

    const [formData, setFormData] =
        useState({

            name: "",

            email: "",

            phone: ""

        });


    // ============================================================
    // PASSWORD FORM
    // ============================================================

    const [passwordData, setPasswordData] =
        useState({

            currentPassword: "",

            newPassword: "",

            confirmPassword: ""

        });


    const [changingPassword, setChangingPassword] =
        useState(false);


    // ============================================================
    // PASSWORD SECTION
    // ============================================================

    const [showPasswordSection, setShowPasswordSection] =
        useState(false);


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


            const response =
                await fetch(

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


            setProfile(
                data.user
            );


            setFormData({

                name:
                    data.user?.name || "",

                email:
                    data.user?.email || "",

                phone:
                    data.user?.phone || ""

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
    // HANDLE PROFILE INPUT
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
    // HANDLE PASSWORD INPUT
    // ============================================================

    const handlePasswordChange =
        (event) => {

            const {
                name,
                value
            } = event.target;


            setPasswordData(
                (previousData) => ({

                    ...previousData,

                    [name]:
                        value

                })
            );

        };


    // ============================================================
    // UPDATE PROFILE
    // ============================================================

    const handleSubmit =
        async (event) => {

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


                const response =
                    await fetch(

                        "http://localhost:5000/api/profile",

                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify({

                                    name:
                                        formData.name.trim(),

                                    phone:
                                        formData.phone.trim()

                                })

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(

                        data.message ||
                        "Failed to update profile"

                    );

                }


                setProfile(
                    data.user
                );


                setFormData({

                    name:
                        data.user?.name || "",

                    email:
                        data.user?.email || "",

                    phone:
                        data.user?.phone || ""

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
    // SELECT PROFILE PICTURE
    // ============================================================

    const handlePictureSelect =
        () => {

            fileInputRef.current?.click();

        };


    // ============================================================
    // UPLOAD PROFILE PICTURE
    // ============================================================

    const handlePictureChange =
        async (event) => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            setError("");

            setSuccess("");


            // ----------------------------------------------------
            // CLIENT-SIDE FILE VALIDATION
            // ----------------------------------------------------

            const allowedTypes = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                setError(
                    "Only JPG, PNG and WEBP images are allowed."
                );

                event.target.value = "";

                return;

            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                setError(
                    "Profile picture must be smaller than 5 MB."
                );

                event.target.value = "";

                return;

            }


            try {

                setUploadingPicture(true);


                const token =
                    localStorage.getItem("token");


                if (!token) {

                    navigate("/login");

                    return;

                }


                const uploadData =
                    new FormData();


                uploadData.append(
                    "profilePicture",
                    file
                );


                const response =
                    await fetch(

                        "http://localhost:5000/api/profile/picture",

                        {

                            method: "POST",

                            headers: {

                                Authorization:
                                    `Bearer ${token}`

                            },

                            body:
                                uploadData

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(

                        data.message ||
                        "Failed to upload profile picture"

                    );

                }


                setProfile(
                    data.user
                );


                setSuccess(
                    "Profile picture updated successfully."
                );

            } catch (error) {

                console.error(
                    "Profile picture upload error:",
                    error
                );

                setError(
                    error.message
                );

            } finally {

                setUploadingPicture(false);

                event.target.value = "";

            }

        };


    // ============================================================
    // REMOVE PROFILE PICTURE
    // ============================================================

    const handleRemovePicture =
        async () => {

            if (
                !profile?.profilePicture?.url
            ) {

                return;

            }


            const confirmed =
                window.confirm(

                    "Are you sure you want to remove your profile picture?"

                );


            if (!confirmed) {

                return;

            }


            setError("");

            setSuccess("");


            try {

                setRemovingPicture(true);


                const token =
                    localStorage.getItem("token");


                const response =
                    await fetch(

                        "http://localhost:5000/api/profile/picture",

                        {

                            method: "DELETE",

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
                        "Failed to remove profile picture"

                    );

                }


                setProfile(
                    data.user
                );


                setSuccess(
                    "Profile picture removed successfully."
                );

            } catch (error) {

                console.error(
                    "Remove picture error:",
                    error
                );

                setError(
                    error.message
                );

            } finally {

                setRemovingPicture(false);

            }

        };


    // ============================================================
    // CHANGE PASSWORD
    // ============================================================

    const handlePasswordSubmit =
        async (event) => {

            event.preventDefault();

            setError("");

            setSuccess("");


            if (
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
            ) {

                setError(
                    "Please fill in all password fields."
                );

                return;

            }


            try {

                setChangingPassword(true);


                const token =
                    localStorage.getItem("token");


                if (!token) {

                    navigate("/login");

                    return;

                }


                const response =
                    await fetch(

                        "http://localhost:5000/api/profile/password",

                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify(
                                    passwordData
                                )

                        }

                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(

                        data.message ||
                        "Failed to change password"

                    );

                }


                setPasswordData({

                    currentPassword: "",

                    newPassword: "",

                    confirmPassword: ""

                });


                setSuccess(
                    "Password changed successfully."
                );


                setShowPasswordSection(
                    false
                );

            } catch (error) {

                console.error(
                    "Change password error:",
                    error
                );

                setError(
                    error.message
                );

            } finally {

                setChangingPassword(false);

            }

        };


    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/login");

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="profile-loading">

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

        <div className="profile-page">


            {/* ==================================================
                BACK
            ================================================== */}

            <Link
                to="/"
                className="profile-back"
            >
                ← Back to Home
            </Link>


            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="profile-page-header">

                <span className="profile-page-label">
                    ACCOUNT
                </span>

                <h1>
                    My Profile
                </h1>

                <p>
                    Manage your PaisaVasool account information.
                </p>

            </div>


            {/* ==================================================
                MESSAGES
            ================================================== */}

            {error && (

                <div className="profile-message profile-error">
                    {error}
                </div>

            )}


            {success && (

                <div className="profile-message profile-success">
                    {success}
                </div>

            )}


            {/* ==================================================
                PROFILE HERO
            ================================================== */}

            {profile && (

                <div className="profile-hero-card">


                    <div className="profile-hero-left">


                        <div className="profile-picture-wrapper">


                            {profile.profilePicture?.url ? (

                                <img
                                    src={
                                        profile.profilePicture.url
                                    }
                                    alt="Profile"
                                    className="profile-picture"
                                />

                            ) : (

                                <div className="profile-picture-placeholder">

                                    {profile.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}

                                </div>

                            )}


                            <button
                                type="button"
                                className="profile-picture-edit"
                                onClick={
                                    handlePictureSelect
                                }
                                disabled={
                                    uploadingPicture
                                }
                                title="Change profile picture"
                            >
                                +
                            </button>


                        </div>


                        <div className="profile-hero-info">

                            <h2>
                                {profile.name}
                            </h2>

                            <p>
                                {profile.email}
                            </p>

                            <span className="profile-role-badge">
                                {profile.role}
                            </span>

                        </div>


                    </div>


                    <div className="profile-picture-actions">

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={
                                handlePictureChange
                            }
                            hidden
                        />


                        <button
                            type="button"
                            className="profile-outline-button"
                            onClick={
                                handlePictureSelect
                            }
                            disabled={
                                uploadingPicture
                            }
                        >

                            {uploadingPicture
                                ? "Uploading..."
                                : "Change Photo"}

                        </button>


                        {profile.profilePicture?.url && (

                            <button
                                type="button"
                                className="profile-remove-button"
                                onClick={
                                    handleRemovePicture
                                }
                                disabled={
                                    removingPicture
                                }
                            >

                                {removingPicture
                                    ? "Removing..."
                                    : "Remove"}

                            </button>

                        )}

                    </div>


                </div>

            )}


            {/* ==================================================
                MAIN PROFILE GRID
            ================================================== */}

            <div className="profile-main-grid">


                {/* ==================================================
                    PROFILE INFORMATION
                ================================================== */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div>

                            <h2>
                                Profile Information
                            </h2>

                            <p>
                                Update your personal information.
                            </p>

                        </div>

                    </div>


                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="profile-form"
                    >


                        {/* NAME */}

                        <div className="profile-field">

                            <label htmlFor="profile-name">
                                Name
                            </label>

                            <input
                                id="profile-name"
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

                        <div className="profile-field">

                            <label htmlFor="profile-email">
                                Email
                            </label>

                            <input
                                id="profile-email"
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


                        {/* PHONE */}

                        <div className="profile-field">

                            <label htmlFor="profile-phone">
                                Phone Number
                            </label>

                            <input
                                id="profile-phone"
                                type="tel"
                                name="phone"
                                value={
                                    formData.phone
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="+91 XXXXX XXXXX"
                            />

                        </div>


                        <button
                            type="submit"
                            className="profile-primary-button"
                            disabled={
                                saving
                            }
                        >

                            {saving
                                ? "Saving..."
                                : "Save Changes"}

                        </button>


                    </form>

                </section>


                {/* ==================================================
                    ACCOUNT INFORMATION
                ================================================== */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <div>

                            <h2>
                                Account Information
                            </h2>

                            <p>
                                Your account details and status.
                            </p>

                        </div>

                    </div>


                    <div className="account-info-list">


                        <div className="account-info-item">

                            <span>
                                Account ID
                            </span>

                            <strong className="account-id">
                                {profile?._id}
                            </strong>

                        </div>


                        <div className="account-info-item">

                            <span>
                                Role
                            </span>

                            <strong>
                                {profile?.role}
                            </strong>

                        </div>


                        <div className="account-info-item">

                            <span>
                                Email Verified
                            </span>

                            <strong
                                className={
                                    profile?.isEmailVerified
                                        ? "account-status verified"
                                        : "account-status not-verified"
                                }
                            >

                                {profile?.isEmailVerified
                                    ? "Verified"
                                    : "Not Verified"}

                            </strong>

                        </div>


                        <div className="account-info-item">

                            <span>
                                Account Status
                            </span>

                            <strong
                                className={
                                    profile?.isActive
                                        ? "account-status verified"
                                        : "account-status not-verified"
                                }
                            >

                                {profile?.isActive
                                    ? "Active"
                                    : "Inactive"}

                            </strong>

                        </div>


                    </div>

                </section>


            </div>


            {/* ==================================================
                ACCOUNT SETTINGS
            ================================================== */}

            <section className="profile-card profile-settings-card">

                <div className="profile-card-header">

                    <div>

                        <h2>
                            Account Settings
                        </h2>

                        <p>
                            Manage your account and access important sections.
                        </p>

                    </div>

                </div>


                {/* CHANGE PASSWORD */}

                <button
                    type="button"
                    className="profile-setting-row"
                    onClick={() => {

                        setShowPasswordSection(
                            !showPasswordSection
                        );

                        setError("");

                        setSuccess("");

                    }}
                >

                    <div>

                        <strong>
                            Change Password
                        </strong>

                        <span>
                            Update your account password securely.
                        </span>

                    </div>

                    <span className="profile-setting-arrow">
                        {showPasswordSection
                            ? "↑"
                            : "→"}
                    </span>

                </button>


                {/* PASSWORD FORM */}

                {showPasswordSection && (

                    <form
                        onSubmit={
                            handlePasswordSubmit
                        }
                        className="password-form"
                    >


                        <div className="profile-field">

                            <label htmlFor="current-password">
                                Current Password
                            </label>

                            <input
                                id="current-password"
                                type="password"
                                name="currentPassword"
                                value={
                                    passwordData.currentPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                placeholder="Enter current password"
                            />

                        </div>


                        <div className="profile-field">

                            <label htmlFor="new-password">
                                New Password
                            </label>

                            <input
                                id="new-password"
                                type="password"
                                name="newPassword"
                                value={
                                    passwordData.newPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                placeholder="Enter new password"
                            />

                        </div>


                        <div className="profile-field">

                            <label htmlFor="confirm-password">
                                Confirm New Password
                            </label>

                            <input
                                id="confirm-password"
                                type="password"
                                name="confirmPassword"
                                value={
                                    passwordData.confirmPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                placeholder="Confirm new password"
                            />

                        </div>


                        <button
                            type="submit"
                            className="profile-primary-button"
                            disabled={
                                changingPassword
                            }
                        >

                            {changingPassword
                                ? "Changing Password..."
                                : "Change Password"}

                        </button>

                    </form>

                )}


                {/* MY ORDERS */}

                <Link
                    to="/orders"
                    className="profile-setting-row"
                >

                    <div>

                        <strong>
                            My Orders
                        </strong>

                        <span>
                            View and manage your orders.
                        </span>

                    </div>

                    <span className="profile-setting-arrow">
                        →
                    </span>

                </Link>


                {/* PRICE ALERTS */}

                <Link
                    to="/price-alerts"
                    className="profile-setting-row"
                >

                    <div>

                        <strong>
                            Price Alerts
                        </strong>

                        <span>
                            Manage your product price alerts.
                        </span>

                    </div>

                    <span className="profile-setting-arrow">
                        →
                    </span>

                </Link>


                {/* LOGOUT */}

                <button
                    type="button"
                    className="profile-setting-row"
                    onClick={handleLogout}
                >

                    <div>

                        <strong>
                            Logout
                        </strong>

                        <span>
                            Sign out of your PaisaVasool account securely.
                        </span>

                    </div>

                    <span className="profile-setting-arrow">
                        →
                    </span>

                </button>


            </section>


        </div>

    );

}

export default Profile;