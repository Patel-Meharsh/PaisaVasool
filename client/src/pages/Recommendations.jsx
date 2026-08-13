import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Recommendations() {

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // FETCH RECOMMENDATIONS
    // ============================================================

    useEffect(() => {

        const fetchRecommendations = async () => {

            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    "http://localhost:5000/api/products/recommendations",
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to fetch recommendations"
                    );
                }

                setRecommendations(
                    data.recommendations || []
                );

            } catch (error) {

                console.error(
                    "Recommendations error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);

            }
        };

        fetchRecommendations();

    }, []);


    // ============================================================
    // HIDE FOR LOGGED-OUT USERS
    // ============================================================

    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <section className="recommendations">

                <h2>
                    Recommended for You
                </h2>

                <p>
                    Finding products you may like...
                </p>

            </section>
        );

    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (
            <section className="recommendations">

                <h2>
                    Recommended for You
                </h2>

                <p className="error-message">
                    {error}
                </p>

            </section>
        );

    }


    // ============================================================
    // NO PRODUCTS
    // ============================================================

    if (recommendations.length === 0) {
        return null;
    }


    // ============================================================
    // RECOMMENDATION CARDS
    // ============================================================

    return (

        <section className="recommendations">

            <div className="recommendations-header">

                <h2>
                    Recommended for You
                </h2>

                <p>
                    Products you may be interested in
                </p>

            </div>


            <div className="recommendation-grid">

                {recommendations.map((product) => (

                    <div
                        className="recommendation-card"
                        key={product._id}
                    >

                        {/* Product Image */}

                        <Link
                            to={`/products/${product._id}`}
                            className="recommendation-image"
                        >

                            {product.images &&
                            product.images.length > 0 ? (

                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                />

                            ) : (

                                <div className="no-image">
                                    No Image Available
                                </div>

                            )}

                        </Link>


                        {/* Product Details */}

                        <div className="recommendation-details">

                            <h3>
                                {product.name}
                            </h3>


                            {product.brand && (

                                <p className="recommendation-brand">
                                    {product.brand}
                                </p>

                            )}


                            <p className="recommendation-price">
                                ₹{product.price}
                            </p>


                            <p
                                className={
                                    product.stock > 0
                                        ? "recommendation-stock"
                                        : "recommendation-out-of-stock"
                                }
                            >
                                {product.stock > 0
                                    ? "In Stock"
                                    : "Out of Stock"}
                            </p>


                            <Link
                                to={`/products/${product._id}`}
                                className="view-product-button"
                            >
                                View Product
                            </Link>

                        </div>

                    </div>

                ))}

            </div>

        </section>

    );
}

export default Recommendations;