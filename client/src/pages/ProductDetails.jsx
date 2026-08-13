import { useEffect, useState } from "react";
import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

function ProductDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);

    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");

    // ============================================================
    // PRICE ALERT STATES
    // ============================================================

    const [targetPrice, setTargetPrice] = useState("");
    const [creatingAlert, setCreatingAlert] = useState(false);

    const [alertMessage, setAlertMessage] = useState("");
    const [alertError, setAlertError] = useState("");

    // ============================================================
    // FETCH PRODUCT
    // ============================================================

    useEffect(() => {

        const fetchProduct = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    `http://localhost:5000/api/products/${id}`
                );

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to fetch product"
                    );

                }

                setProduct(data.product);

            } catch (error) {

                console.error(
                    "Product details error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);

            }
        };

        fetchProduct();

    }, [id]);

    // ============================================================
    // ADD TO CART
    // ============================================================

    const handleAddToCart = async () => {

        const token =
            localStorage.getItem("token");

        if (!token) {

            navigate("/login");

            return;
        }

        setAdding(true);
        setCartMessage("");
        setCartError("");

        try {

            const response = await fetch(
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
                        productId: product._id,
                        quantity
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to add product to cart"
                );

            }

            setCartMessage(
                "Product added to cart successfully!"
            );

        } catch (error) {

            console.error(
                "Add to cart error:",
                error
            );

            setCartError(
                error.message
            );

        } finally {

            setAdding(false);

        }
    };

    // ============================================================
    // CREATE PRICE ALERT
    // ============================================================

    const handleCreatePriceAlert = async () => {

        const token =
            localStorage.getItem("token");

        // User must be logged in
        if (!token) {

            navigate("/login");

            return;
        }

        setAlertMessage("");
        setAlertError("");

        // Convert input to number
        const price = Number(targetPrice);

        // Validate input
        if (
            targetPrice === "" ||
            Number.isNaN(price)
        ) {

            setAlertError(
                "Please enter a valid target price."
            );

            return;
        }

        // Target price must be positive
        if (price < 0) {

            setAlertError(
                "Target price cannot be negative."
            );

            return;
        }

        // Target price must be lower than current price
        if (price >= product.price) {

            setAlertError(
                "Target price must be lower than the current product price."
            );

            return;
        }

        setCreatingAlert(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/price-alerts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        productId: product._id,
                        targetPrice: price
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to create price alert"
                );

            }

            setAlertMessage(
                "Price alert created successfully!"
            );

            // Clear input after successful creation
            setTargetPrice("");

        } catch (error) {

            console.error(
                "Create price alert error:",
                error
            );

            setAlertError(
                error.message
            );

        } finally {

            setCreatingAlert(false);

        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div className="product-details">

                <h2>
                    Loading product...
                </h2>

            </div>
        );

    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (
            <div className="product-details">

                <h2>
                    Something went wrong
                </h2>

                <p>
                    {error}
                </p>

                <Link to="/products">
                    Back to Products
                </Link>

            </div>
        );

    }

    // ============================================================
    // PRODUCT NOT FOUND
    // ============================================================

    if (!product) {

        return (
            <div className="product-details">

                <h2>
                    Product not found
                </h2>

                <Link to="/products">
                    Back to Products
                </Link>

            </div>
        );

    }

    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="product-details">

            {/* Back */}

            <Link to="/products">
                ← Back to Products
            </Link>


            <div className="product-details-content">

                {/* =================================================
                    IMAGE
                ================================================= */}

                <div className="product-details-image">

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

                </div>


                {/* =================================================
                    INFORMATION
                ================================================= */}

                <div className="product-details-info">

                    <h1>
                        {product.name}
                    </h1>


                    <p className="product-description">
                        {product.description}
                    </p>


                    <p>
                        <strong>
                            Brand:
                        </strong>{" "}
                        {product.brand || "N/A"}
                    </p>


                    <p>
                        <strong>
                            Category:
                        </strong>{" "}
                        {product.category?.name || "N/A"}
                    </p>


                    <h2 className="product-price">
                        ₹{product.price}
                    </h2>


                    <p>
                        {product.stock > 0
                            ? `${product.stock} available`
                            : "Out of stock"}
                    </p>


                    {/* =================================================
                        QUANTITY
                    ================================================= */}

                    {product.stock > 0 && (

                        <div className="quantity-section">

                            <label>
                                Quantity
                            </label>


                            <div className="quantity-controls">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity(
                                            (previous) =>
                                                Math.max(
                                                    1,
                                                    previous - 1
                                                )
                                        )
                                    }
                                    disabled={
                                        quantity <= 1
                                    }
                                >
                                    −
                                </button>


                                <span>
                                    {quantity}
                                </span>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setQuantity(
                                            (previous) =>
                                                Math.min(
                                                    product.stock,
                                                    previous + 1
                                                )
                                        )
                                    }
                                    disabled={
                                        quantity >=
                                        product.stock
                                    }
                                >
                                    +
                                </button>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        ADD TO CART
                    ================================================= */}

                    {product.stock > 0 ? (

                        <button
                            className="add-to-cart-button"
                            onClick={handleAddToCart}
                            disabled={adding}
                        >
                            {adding
                                ? "Adding..."
                                : "Add to Cart"}
                        </button>

                    ) : (

                        <button disabled>
                            Out of Stock
                        </button>

                    )}


                    {/* =================================================
                        CART MESSAGES
                    ================================================= */}

                    {cartMessage && (

                        <p className="success-message">
                            {cartMessage}
                        </p>

                    )}


                    {cartError && (

                        <p className="error-message">
                            {cartError}
                        </p>

                    )}


                    {/* =================================================
                        VIEW CART
                    ================================================= */}

                    {cartMessage && (

                        <button
                            onClick={() =>
                                navigate("/cart")
                            }
                        >
                            View Cart
                        </button>

                    )}


                    {/* =================================================
                        PRICE ALERT
                    ================================================= */}

                    <div className="price-alert-section">

                        <h3>
                            Price Alert
                        </h3>


                        <p>
                            Want to buy this product
                            when the price drops?
                        </p>


                        {localStorage.getItem("token") ? (

                            <>

                                <label>
                                    Target Price
                                </label>


                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={targetPrice}
                                    onChange={(event) =>
                                        setTargetPrice(
                                            event.target.value
                                        )
                                    }
                                    placeholder={`Enter price below ₹${product.price}`}
                                />


                                <button
                                    type="button"
                                    onClick={
                                        handleCreatePriceAlert
                                    }
                                    disabled={
                                        creatingAlert
                                    }
                                >
                                    {creatingAlert
                                        ? "Setting Alert..."
                                        : "Set Price Alert"}
                                </button>


                                {alertMessage && (

                                    <p className="success-message">
                                        {alertMessage}
                                    </p>

                                )}


                                {alertError && (

                                    <p className="error-message">
                                        {alertError}
                                    </p>

                                )}


                                {alertMessage && (

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                "/price-alerts"
                                            )
                                        }
                                    >
                                        View My Price Alerts
                                    </button>

                                )}

                            </>

                        ) : (

                            <p>
                                <Link to="/login">
                                    Login
                                </Link>{" "}
                                to set a price alert.
                            </p>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default ProductDetails;