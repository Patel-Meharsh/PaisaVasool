import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {

    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const [search, setSearch] = useState("");


    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = async () => {
        const currentToken = localStorage.getItem("token");

        try {
            // Invalidate the JWT on the server before removing the
            // browser copy. If the request fails, local logout still
            // happens in finally below.
            if (currentToken) {
                await fetch(
                    "http://localhost:5000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${currentToken}`
                        }
                    }
                );
            }
        } catch (error) {
            console.error(
                "Server logout error:",
                error
            );
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/");
            window.location.reload();
        }
    };


    // ============================================================
    // SEARCH
    // ============================================================

    const handleSearch = (event) => {
        event.preventDefault();

        if (!search.trim()) {
            return;
        }

        navigate(
            `/products?search=${encodeURIComponent(
                search.trim()
            )}`
        );
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <header className="site-header">

            <div className="navbar">

                <div className="navbar-logo">
                    <Link to="/">
                        <img
                            src="/PaisaVasool.png"
                            alt="PaisaVasool"
                        />
                    </Link>
                </div>


                <nav className="navbar-menu">
                    <Link to="/">
                        Home
                    </Link>

                    <Link to="/#bestsellers">
                        Shop
                    </Link>

                    <Link to="/products">
                        Products
                    </Link>

                    {token && (
                        <Link to="/orders">
                            Orders
                        </Link>
                    )}

                    {token && (
                        <Link to="/price-alerts">
                            Price Alerts
                        </Link>
                    )}
                </nav>


                <div className="navbar-actions">

                    <form
                        className="navbar-search"
                        onSubmit={handleSearch}
                    >
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            autoComplete="off"
                        />

                        <button type="submit">
                            <span>
                                ⌕
                            </span>
                        </button>
                    </form>


                    {token ? (
                        <>
                            <Link
                                to="/cart"
                                className="nav-icon"
                                title="Cart"
                            >
                                🛒
                            </Link>

                            <Link
                                to="/profile"
                                className="nav-icon"
                                title="Profile"
                                aria-label="Profile"
                            >
                                <svg
                                    width="30"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="12"
                                        cy="8"
                                        r="4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />

                                    <path
                                        d="M4 21C4.8 16.8 7.4 14 12 14C16.6 14 19.2 16.8 20 21"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </Link>

                            {user?.role === "admin" && (
                                <Link
                                    to="/admin"
                                    className="nav-admin"
                                >
                                    Admin
                                </Link>
                            )}

                            <button
                                className="nav-login-button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="nav-login-button"
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="nav-register-button"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
