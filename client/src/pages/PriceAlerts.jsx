import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function PriceAlerts() {

    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [priceAlerts, setPriceAlerts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [deletingAlertId, setDeletingAlertId] =
        useState(null);


    // ============================================================
    // FETCH PRICE ALERTS
    // ============================================================

    const fetchPriceAlerts = async () => {

        try {

            setLoading(true);

            setError("");

            const token =
                localStorage.getItem("token");


            // ----------------------------------------------------
            // Check login
            // ----------------------------------------------------

            if (!token) {

                navigate("/login");

                return;

            }


            // ----------------------------------------------------
            // Fetch user's price alerts
            // ----------------------------------------------------

            const response = await fetch(
                "http://localhost:5000/api/price-alerts",
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


            // ----------------------------------------------------
            // Handle API error
            // ----------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch price alerts"
                );

            }


            // ----------------------------------------------------
            // Store alerts
            // ----------------------------------------------------

            setPriceAlerts(
                data.priceAlerts || []
            );


        } catch (error) {

            console.error(
                "Fetch price alerts error:",
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
    // LOAD PRICE ALERTS
    // ============================================================

    useEffect(() => {

        fetchPriceAlerts();

    }, []);


    // ============================================================
    // DELETE PRICE ALERT
    // ============================================================

    const handleDeleteAlert = async (alertId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to remove this price alert?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setDeletingAlertId(alertId);

            setError("");

            setSuccess("");


            const token =
                localStorage.getItem("token");


            // ----------------------------------------------------
            // Check login
            // ----------------------------------------------------

            if (!token) {

                navigate("/login");

                return;

            }


            // ----------------------------------------------------
            // Delete alert
            // ----------------------------------------------------

            const response = await fetch(
                `http://localhost:5000/api/price-alerts/${alertId}`,
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


            // ----------------------------------------------------
            // Handle API error
            // ----------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to delete price alert"
                );

            }


            // ----------------------------------------------------
            // Remove alert from UI
            // ----------------------------------------------------

            setPriceAlerts(
                (previousAlerts) =>
                    previousAlerts.filter(
                        (alert) =>
                            alert._id !== alertId
                    )
            );


            setSuccess(
                "Price alert removed successfully."
            );


        } catch (error) {

            console.error(
                "Delete price alert error:",
                error
            );

            setError(
                error.message
            );


        } finally {

            setDeletingAlertId(null);

        }

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div>

                <h2>
                    Loading price alerts...
                </h2>

            </div>

        );

    }


    // ============================================================
    // UI
    // ============================================================

    return (

        <div>

            {/* ==================================================
                HEADER
            ================================================== */}

            <Link to="/products">
                ← Back to Products
            </Link>


            <h1>
                Price Alerts
            </h1>


            <p>
                Get notified when a product reaches your target price.
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
                NO ALERTS
            ================================================== */}

            {priceAlerts.length === 0 ? (

                <div>

                    <h2>
                        No price alerts found.
                    </h2>

                    <p>
                        You haven't created any price alerts yet.
                    </p>

                    <Link to="/products">
                        Browse Products
                    </Link>

                </div>

            ) : (

                <div>

                    {/* ==================================================
                        ALERT COUNT
                    ================================================== */}

                    <h2>
                        My Price Alerts
                    </h2>


                    <p>
                        {priceAlerts.length} active alert
                        {priceAlerts.length !== 1 ? "s" : ""}
                    </p>


                    {/* ==================================================
                        PRICE ALERTS
                    ================================================== */}

                    {priceAlerts.map((alert) => (

                        <div
                            key={alert._id}
                        >

                            <hr />


                            {/* ==========================================
                                PRODUCT INFORMATION
                            ========================================== */}

                            <h3>
                                {alert.product?.name ||
                                    "Product unavailable"}
                            </h3>


                            {/* ==========================================
                                PRODUCT IMAGE
                            ========================================== */}

                            {alert.product?.images &&
                                alert.product.images.length > 0 && (

                                    <img
                                        src={
                                            alert.product.images[0]
                                        }
                                        alt={
                                            alert.product.name
                                        }
                                        width="150"
                                    />

                                )}


                            {/* ==========================================
                                CURRENT PRICE
                            ========================================== */}

                            <p>

                                Current Price:{" "}

                                <strong>
                                    ₹
                                    {
                                        alert.currentPrice ??
                                        alert.product?.price ??
                                        "N/A"
                                    }
                                </strong>

                            </p>


                            {/* ==========================================
                                TARGET PRICE
                            ========================================== */}

                            <p>

                                Target Price:{" "}

                                <strong>
                                    ₹{alert.targetPrice}
                                </strong>

                            </p>


                            {/* ==========================================
                                PRICE DIFFERENCE
                            ========================================== */}

                            {alert.currentPrice !== undefined && (

                                <p>

                                    You are waiting for the price
                                    to drop by ₹
                                    {
                                        Math.max(
                                            0,
                                            alert.currentPrice -
                                            alert.targetPrice
                                        )
                                    }

                                </p>

                            )}


                            {/* ==========================================
                                ALERT STATUS
                            ========================================== */}

                            <p>

                                Status:{" "}

                                <strong>

                                    {alert.isNotified
                                        ? "Price reached"
                                        : "Waiting for target price"}

                                </strong>

                            </p>


                            {/* ==========================================
                                CREATED DATE
                            ========================================== */}

                            <p>

                                Alert Created:{" "}

                                {alert.createdAt
                                    ? new Date(
                                        alert.createdAt
                                    ).toLocaleString()
                                    : "Unknown"}

                            </p>


                            {/* ==========================================
                                DELETE BUTTON
                            ========================================== */}

                            <button

                                type="button"

                                onClick={() =>
                                    handleDeleteAlert(
                                        alert._id
                                    )
                                }

                                disabled={
                                    deletingAlertId ===
                                    alert._id
                                }

                            >

                                {deletingAlertId ===
                                alert._id

                                    ? "Removing..."

                                    : "Remove Alert"

                                }

                            </button>

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}


export default PriceAlerts;