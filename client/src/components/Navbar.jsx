import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const [search, setSearch] = useState("");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
        window.location.reload();
    };

    const handleSearch = (e) => {
        e.preventDefault();

        if (!search.trim()) return;

        navigate(
            `/products?search=${encodeURIComponent(search.trim())}`
        );
    };

    return (
        <header className="site-header">

            {/* TOP NAVBAR */}
            <div className="navbar">

                {/* LOGO */}
                <div className="navbar-logo">
                    <Link to="/">
                        <img
                            src="/PaisaVasool.png"
                            alt="PaisaVasool"
                        />
                    </Link>
                </div>


                {/* MAIN NAVIGATION */}
                <nav className="navbar-menu">

                    <Link to="/">
                        Home
                    </Link>

                    <Link to="/products">
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


                {/* RIGHT SIDE */}
                <div className="navbar-actions">

                    {/* SEARCH */}
                    <form
                        className="navbar-search"
                        onSubmit={handleSearch}
                    >
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        <button type="submit">
                            <span>⌕</span>
                        </button>
                    </form>


                    {/* LOGGED IN */}
                    {token ? (
                        <>

                            {/* CART */}
                            <Link
                                to="/cart"
                                className="nav-icon"
                                title="Cart"
                            >
                                🛒
                            </Link>


                            {/* PROFILE */}
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


                            {/* ADMIN */}
                            {user?.role === "admin" && (
                                <Link
                                    to="/admin"
                                    className="nav-admin"
                                >
                                    Admin
                                </Link>
                            )}


                            {/* LOGOUT */}
                            <button
                                className="nav-login-button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </>
                    ) : (

                        /* LOGGED OUT */
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