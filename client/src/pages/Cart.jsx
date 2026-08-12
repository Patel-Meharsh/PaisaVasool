import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Cart() {

    const navigate = useNavigate();

    const [cart, setCart] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");

    // ============================================================
    // FETCH CART
    // ============================================================

    const fetchCart = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/cart",
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

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch cart"
                );

            }

            setCart(data.cart);

        } catch (error) {

            console.error(
                "Cart error:",
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
    // UPDATE QUANTITY
    // ============================================================

    const updateQuantity = async (
        productId,
        quantity
    ) => {

        if (quantity < 1) {
            return;
        }

        try {

            setActionLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/cart/update",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        productId,
                        quantity
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update cart"
                );

            }

            setCart(data.cart);

        } catch (error) {

            console.error(
                "Update cart error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setActionLoading(false);

        }
    };

    // ============================================================
    // REMOVE PRODUCT
    // ============================================================

    const removeProduct = async (
        productId
    ) => {

        try {

            setActionLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/cart/remove/${productId}`,
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
                    "Failed to remove product"
                );

            }

            setCart(data.cart);

        } catch (error) {

            console.error(
                "Remove product error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setActionLoading(false);

        }
    };

    // ============================================================
    // CLEAR CART
    // ============================================================

    const clearCart = async () => {

        const confirmClear =
            window.confirm(
                "Are you sure you want to clear your cart?"
            );

        if (!confirmClear) {
            return;
        }

        try {

            setActionLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/cart/clear",
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
                    "Failed to clear cart"
                );

            }

            setCart(data.cart);

        } catch (error) {

            console.error(
                "Clear cart error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setActionLoading(false);

        }
    };

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        fetchCart();
    }, []);

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div className="cart-page">
                <h2>Loading cart...</h2>
            </div>
        );

    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error && !cart) {

        return (
            <div className="cart-page">

                <h1>Your Cart</h1>

                <p className="error-message">
                    {error}
                </p>

                <button
                    onClick={fetchCart}
                >
                    Try Again
                </button>

            </div>
        );

    }

    // ============================================================
    // EMPTY CART
    // ============================================================

    if (
        !cart ||
        !cart.items ||
        cart.items.length === 0
    ) {

        return (
            <div className="cart-page">

                <h1>Your Cart</h1>

                <p>
                    Your cart is empty.
                </p>

                <Link to="/products">
                    Continue Shopping
                </Link>

            </div>
        );

    }

    // ============================================================
    // TOTAL
    // ============================================================

    const total =
        cart.items.reduce(
            (sum, item) => {

                return (
                    sum +
                    item.product.price *
                    item.quantity
                );

            },
            0
        );

    // ============================================================
    // TOTAL ITEMS
    // ============================================================

    const totalItems =
        cart.items.reduce(
            (sum, item) =>
                sum + item.quantity,
            0
        );

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="cart-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="cart-header">

                <div>

                    <h1>Your Cart</h1>

                    <p>
                        {totalItems} item
                        {totalItems !== 1
                            ? "s"
                            : ""}
                    </p>

                </div>

                <Link to="/products">
                    Continue Shopping
                </Link>

            </div>

            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {/* ====================================================
                CLEAR CART
            ==================================================== */}

            <button
                onClick={clearCart}
                disabled={actionLoading}
            >
                Clear Cart
            </button>

            {/* ====================================================
                CART ITEMS
            ==================================================== */}

            <div className="cart-items">

                {cart.items.map((item) => (

                    <div
                        className="cart-item"
                        key={item.product._id}
                    >

                        {/* IMAGE */}

                        <div className="cart-item-image">

                            {item.product.images &&
                            item.product.images.length > 0 ? (

                                <img
                                    src={
                                        item.product.images[0]
                                    }
                                    alt={
                                        item.product.name
                                    }
                                />

                            ) : (

                                <p>
                                    No Image
                                </p>

                            )}

                        </div>

                        {/* INFORMATION */}

                        <div className="cart-item-info">

                            <h3>
                                {item.product.name}
                            </h3>

                            <p>
                                Brand:{" "}
                                {item.product.brand ||
                                    "N/A"}
                            </p>

                            <p>
                                ₹{item.product.price}
                            </p>

                        </div>

                        {/* QUANTITY */}

                        <div className="cart-quantity">

                            <button
                                onClick={() =>
                                    updateQuantity(
                                        item.product._id,
                                        item.quantity - 1
                                    )
                                }
                                disabled={
                                    actionLoading ||
                                    item.quantity <= 1
                                }
                            >
                                −
                            </button>

                            <span>
                                {item.quantity}
                            </span>

                            <button
                                onClick={() =>
                                    updateQuantity(
                                        item.product._id,
                                        item.quantity + 1
                                    )
                                }
                                disabled={
                                    actionLoading ||
                                    item.quantity >=
                                        item.product.stock
                                }
                            >
                                +
                            </button>

                        </div>

                        {/* SUBTOTAL */}

                        <div className="cart-item-subtotal">

                            <strong>
                                ₹
                                {item.product.price *
                                    item.quantity}
                            </strong>

                        </div>

                        {/* REMOVE */}

                        <button
                            onClick={() =>
                                removeProduct(
                                    item.product._id
                                )
                            }
                            disabled={actionLoading}
                        >
                            Remove
                        </button>

                    </div>

                ))}

            </div>

            {/* ====================================================
                CART SUMMARY
            ==================================================== */}

            <div className="cart-summary">

                <h2>
                    Order Summary
                </h2>

                <p>
                    Items: {totalItems}
                </p>

                <h2>
                    Total: ₹{total}
                </h2>

                <button
                    onClick={() =>
                        navigate("/checkout")
                    }
                >
                    Proceed to Checkout
                </button>

            </div>

        </div>
    );
}

export default Cart;