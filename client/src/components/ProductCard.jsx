import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function ProductCard({ product }) {

    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);


    // ============================================================
    // ADD TO CART
    // ============================================================

    const handleAddToCart = async () => {

        // Check whether user is logged in
        const token =
            localStorage.getItem("token");


        if (!token) {

            navigate("/login");

            return;

        }


        setMessage("");
        setError("");
        setAdding(true);


        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/cart/add",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            productId:
                                product._id,

                            quantity: 1
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                setError(
                    data.message ||
                    "Failed to add product to cart"
                );

                return;

            }


            setMessage(
                "Added to cart!"
            );


        } catch (error) {

            setError(
                "Unable to connect to server"
            );


        } finally {

            setAdding(false);

        }

    };


    // ============================================================
    // PRODUCT CARD
    // ============================================================

    return (

        <div className="product-card">


            {/* ==================================================
                PRODUCT IMAGE
            ================================================== */}

            <div className="product-image">

                {product.images &&
                product.images.length > 0 ? (

                    <img
                        src={product.images[0]}
                        alt={product.name}
                    />

                ) : (

                    <div className="product-no-image">
                        No Image
                    </div>

                )}

            </div>


            {/* ==================================================
                PRODUCT INFORMATION
            ================================================== */}

            <div className="product-info">


                {/* PRODUCT NAME */}

                <h2>
                    {product.name}
                </h2>


                {/* BRAND */}

                <p className="product-detail">
                    <span>
                        Brand:
                    </span>{" "}
                    {product.brand || "N/A"}
                </p>


                {/* CATEGORY */}

                <p className="product-detail">
                    <span>
                        Category:
                    </span>{" "}
                    {product.category?.name || "N/A"}
                </p>


                {/* PRICE */}

                <h3 className="product-price">
                    ₹
                    {Number(
                        product.price
                    ).toLocaleString("en-IN")}
                </h3>


                {/* STOCK */}

                <p
                    className={
                        product.stock > 0
                            ? "product-stock"
                            : "product-stock product-out-of-stock"
                    }
                >
                    {product.stock > 0
                        ? `${product.stock} available`
                        : "Out of stock"}
                </p>


                {/* ==================================================
                    ACTION BUTTONS
                ================================================== */}

                <div className="product-actions">


                    {/* VIEW DETAILS */}

                    <Link
                        to={`/products/${product._id}`}
                        className="product-details-button"
                    >
                        View Details
                    </Link>


                    {/* ADD TO CART */}

                    <button
                        className="product-cart-button"
                        onClick={handleAddToCart}
                        disabled={
                            product.stock <= 0 ||
                            adding
                        }
                    >

                        {adding
                            ? "Adding..."
                            : product.stock > 0
                            ? "Add to Cart"
                            : "Out of Stock"}

                    </button>

                </div>


                {/* ==================================================
                    SUCCESS MESSAGE
                ================================================== */}

                {message && (

                    <p className="product-success">
                        {message}
                    </p>

                )}


                {/* ==================================================
                    ERROR MESSAGE
                ================================================== */}

                {error && (

                    <p className="product-error">
                        {error}
                    </p>

                )}

            </div>

        </div>

    );

}

export default ProductCard;