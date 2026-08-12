import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function ProductCard({ product }) {
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);

    const handleAddToCart = async () => {
        // Check whether user is logged in
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        setMessage("");
        setError("");
        setAdding(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/cart/add",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        productId: product._id,
                        quantity: 1
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Failed to add product to cart"
                );
                return;
            }

            setMessage("Added to cart!");

        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="product-card">

            {/* Product Image */}
            <div className="product-image">

                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                    />
                ) : (
                    <p>No Image</p>
                )}

            </div>

            {/* Product Information */}
            <div className="product-info">

                <h2>{product.name}</h2>

                <p>
                    Brand: {product.brand || "N/A"}
                </p>

                <p>
                    Category: {product.category?.name || "N/A"}
                </p>

                <h3>
                    ₹{product.price}
                </h3>

                <p>
                    {product.stock > 0
                        ? `${product.stock} available`
                        : "Out of stock"}
                </p>

                {/* Product Details */}
                <Link to={`/products/${product._id}`}>
                    View Details
                </Link>

                {/* Add To Cart */}
                <div>

                    <button
                        onClick={handleAddToCart}
                        disabled={
                            product.stock <= 0 || adding
                        }
                    >
                        {adding
                            ? "Adding..."
                            : product.stock > 0
                            ? "Add to Cart"
                            : "Out of Stock"}
                    </button>

                </div>

                {/* Success Message */}
                {message && (
                    <p>
                        {message}
                    </p>
                )}

                {/* Error Message */}
                {error && (
                    <p>
                        {error}
                    </p>
                )}

            </div>

        </div>
    );
}

export default ProductCard;