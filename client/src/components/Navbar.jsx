import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = async () => {
        const currentToken = localStorage.getItem("token");

        try {
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
            console.error("Server logout error:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
            window.location.reload();
        }
    };

    return (
        <header className="site-header">
            <div className="navbar">
                {/* ==================================================
                    LOGO
                ================================================== */}

                <div className="navbar-logo">
                    <Link to="/">
                        <img
                            src="/PaisaVasool.png"
                            alt="PaisaVasool"
                        />
                    </Link>
                </div>

                {/* ==================================================
                    MAIN NAVIGATION
                ================================================== */}

                <nav className="navbar-menu">
                    <Link to="/">
                        Home
                    </Link>

                    <Link to="/shop">
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

                {/* ==================================================
                    RIGHT SIDE ACTIONS
                    Search intentionally lives on the catalogue page.
                ================================================== */}

                <div className="navbar-actions">
                    {token ? (
                        <>
                            <Link
                                to="/cart"
                                className="nav-icon"
                                title="Cart"
                                aria-label="Cart"
                            >
                                <span className="material-symbols-outlined">
                                    shopping_cart
                                </span>
                            </Link>

                            <Link
                                to="/profile"
                                className="nav-icon"
                                title="Profile"
                                aria-label="Profile"
                            >
                                <span className="material-symbols-outlined">
                                    account_circle
                                </span>
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
                                type="button"
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
