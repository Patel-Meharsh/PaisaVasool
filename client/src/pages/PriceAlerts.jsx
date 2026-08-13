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
                "Are you sure you want to delete this price alert?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setDeletingAlertId(alertId);

            setError("");


            const token =
                localStorage.getItem("token");


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

            <div className="price-alerts-page">

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

        <div className="price-alerts-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="price-alerts-header">

                <h1>
                    Price Alerts
                </h1>

                <p>
                    Get notified when products reach your target price.
                </p>

            </div>


            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (

                <div className="price-alert-error">

                    {error}

                </div>

            )}


            {/* ====================================================
                NO ALERTS
            ==================================================== */}

            {priceAlerts.length === 0 ? (

                <div className="no-price-alerts">

                    <h2>
                        No price alerts yet.
                    </h2>

                    <p>
                        Set a target price on a product and
                        we will notify you when the price drops.
                    </p>

                    <Link to="/products">
                        Browse Products
                    </Link>

                </div>

            ) : (

                <div className="price-alert-list">

                    {priceAlerts.map((alert) => {

                        const product =
                            alert.product;


                        return (

                            <div
                                className="price-alert-card"
                                key={alert._id}
                            >

                                {/* ==================================================
                                    PRODUCT INFORMATION
                                ================================================== */}

                                <div className="price-alert-product">

                                    {/* Product image */}

                                    {product?.images?.length > 0 && (

                                        <img
                                            src={
                                                product.images[0]
                                            }
                                            alt={
                                                product.name
                                            }
                                        />

                                    )}


                                    <div>

                                        <h2>
                                            {product?.name ||
                                                "Product unavailable"}
                                        </h2>


                                        {/* Current price */}

                                        <p>
                                            Current Price:{" "}

                                            <strong>
                                                ₹{product?.price}
                                            </strong>
                                        </p>


                                        {/* Target price */}

                                        <p>
                                            Target Price:{" "}

                                            <strong>
                                                ₹{alert.targetPrice}
                                            </strong>
                                        </p>


                                        {/* Price when alert was created */}

                                        <p>
                                            Price when alert
                                            was created:{" "}

                                            ₹{alert.currentPrice}
                                        </p>

                                    </div>

                                </div>


                                {/* ==================================================
                                    ALERT STATUS
                                ================================================== */}

                                <div className="price-alert-status">

                                    {alert.isNotified ? (

                                        <p>
                                            <strong>
                                                Price Alert Triggered
                                            </strong>
                                        </p>

                                    ) : (

                                        <p>
                                            <strong>
                                                Waiting for target price
                                            </strong>
                                        </p>

                                    )}


                                    {alert.notifiedAt && (

                                        <p>

                                            Notified On:{" "}

                                            {new Date(
                                                alert.notifiedAt
                                            ).toLocaleString()}

                                        </p>

                                    )}

                                </div>


                                {/* ==================================================
                                    ACTIONS
                                ================================================== */}

                                <div className="price-alert-actions">

                                    {product?._id && (

                                        <Link
                                            to={`/products/${product._id}`}
                                        >
                                            View Product
                                        </Link>

                                    )}


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

                                            ? "Deleting..."

                                            : "Delete Alert"}

                                    </button>

                                </div>

                            </div>

                        );

                    })}

                </div>

            )}

        </div>

    );

}


export default PriceAlerts;