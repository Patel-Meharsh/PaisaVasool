import { Link, useNavigate } from "react-router-dom";

function Navbar() {

    const navigate = useNavigate();

    // Check whether the user is logged in
    const token = localStorage.getItem("token");

    // Get logged-in user details
    const user = JSON.parse(
        localStorage.getItem("user")
    );


    // Logout function
    const handleLogout = () => {

        // Remove authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect user to login page
        navigate("/login");

    };


    return (

        <nav className="navbar">

            {/* Logo */}

            <div className="navbar-logo">

                <Link to="/">
                    PaisaVasool
                </Link>

            </div>


            {/* Navigation links */}

            <div className="navbar-links">

                <Link to="/">
                    Home
                </Link>


                <Link to="/products">
                    Products
                </Link>


                <Link to="/cart">
                    Cart
                </Link>


                {/* Show Orders, Profile and Price Alerts when logged in */}

                {token && (
                    <>

                        <Link to="/orders">
                            Orders
                        </Link>


                        <Link to="/profile">
                            Profile
                        </Link>


                        <Link to="/price-alerts">
                            Price Alerts
                        </Link>

                    </>
                )}


                {/* Show Admin only to administrators */}

                {token && user?.role === "admin" && (

                    <Link to="/admin">
                        Admin
                    </Link>

                )}


                {/* Show Login/Register when logged out */}

                {!token && (

                    <>

                        <Link to="/login">
                            Login
                        </Link>


                        <Link to="/register">
                            Register
                        </Link>

                    </>

                )}


                {/* Show Logout when logged in */}

                {token && (

                    <button
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                )}

            </div>

        </nav>

    );

}


export default Navbar;