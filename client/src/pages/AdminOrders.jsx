import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // ============================================================
    // FETCH ALL ORDERS
    // ============================================================

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/orders/admin/all",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch orders"
                );
            }

            setOrders(data.orders || []);
        } catch (error) {
            console.error("Admin orders error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // LOAD ORDERS
    // ============================================================

    useEffect(() => {
        fetchOrders();
    }, []);

    // ============================================================
    // UPDATE ORDER STATUS
    // ============================================================

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            setUpdatingOrderId(orderId);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                `http://localhost:5000/api/orders/admin/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update order status"
                );
            }

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order._id === orderId
                        ? {
                              ...order,
                              status: data.order.status
                          }
                        : order
                )
            );
        } catch (error) {
            console.error(
                "Update order status error:",
                error
            );

            setError(error.message);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="admin-orders-page">
                <div className="admin-orders-loading">
                    <h2>Loading orders...</h2>
                </div>
            </div>
        );
    }

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="admin-orders-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="admin-orders-header">

                <Link
                    to="/admin"
                    className="admin-back-link"
                >
                    ← Back to Dashboard
                </Link>

                <h1>Admin Orders</h1>

                <p>
                    Manage all PaisaVasool customer orders.
                </p>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
                <div className="admin-orders-error">
                    {error}
                </div>
            )}


            {/* ==================================================
                NO ORDERS
            ================================================== */}

            {orders.length === 0 ? (

                <div className="admin-orders-empty">
                    <h2>No orders found.</h2>
                    <p>
                        There are currently no customer orders.
                    </p>
                </div>

            ) : (

                <div className="admin-orders-list">

                    {orders.map((order) => (

                        <div
                            className="admin-order-card"
                            key={order._id}
                        >

                            {/* ==================================================
                                ORDER HEADER
                            ================================================== */}

                            <div className="admin-order-header">

                                <div>
                                    <h2>
                                        Order #{order._id}
                                    </h2>

                                    <p className="admin-order-date">
                                        Date:{" "}
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                <span
                                    className={`order-status-badge ${order.status}`}
                                >
                                    {order.status}
                                </span>

                            </div>


                            {/* ==================================================
                                CUSTOMER + PAYMENT + TOTAL
                            ================================================== */}

                            <div className="admin-order-summary">

                                {/* CUSTOMER */}

                                <div className="admin-order-info-box">

                                    <span className="info-label">
                                        CUSTOMER
                                    </span>

                                    <strong>
                                        {order.user?.name ||
                                            "Unknown"}
                                    </strong>

                                    <small>
                                        {order.user?.email ||
                                            "Unknown"}
                                    </small>

                                </div>


                                {/* PAYMENT */}

                                <div className="admin-order-info-box">

                                    <span className="info-label">
                                        PAYMENT
                                    </span>

                                    <strong>
                                        {order.paymentMethod}
                                    </strong>

                                    <small>
                                        Payment Status:{" "}
                                        <b>
                                            {order.paymentStatus}
                                        </b>
                                    </small>

                                </div>


                                {/* TOTAL */}

                                <div className="admin-order-info-box">

                                    <span className="info-label">
                                        ORDER TOTAL
                                    </span>

                                    <strong className="order-total">
                                        ₹
                                        {Number(
                                            order.totalAmount || 0
                                        ).toLocaleString("en-IN")}
                                    </strong>

                                </div>

                            </div>


                            {/* ==================================================
                                ORDER STATUS
                            ================================================== */}

                            <div className="admin-order-section">

                                <div className="admin-section-title">
                                    ORDER STATUS
                                </div>

                                <div className="order-status-control">

                                    <div>
                                        <span>
                                            Current Status
                                        </span>

                                        <strong>
                                            {order.status}
                                        </strong>
                                    </div>

                                    <select
                                        value={order.status}
                                        disabled={
                                            updatingOrderId ===
                                            order._id
                                        }
                                        onChange={(event) =>
                                            handleStatusChange(
                                                order._id,
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="pending">
                                            Pending
                                        </option>

                                        <option value="confirmed">
                                            Confirmed
                                        </option>

                                        <option value="shipped">
                                            Shipped
                                        </option>

                                        <option value="delivered">
                                            Delivered
                                        </option>

                                        <option value="cancelled">
                                            Cancelled
                                        </option>

                                    </select>

                                    {updatingOrderId ===
                                        order._id && (

                                        <span className="status-updating">
                                            Updating...
                                        </span>

                                    )}

                                </div>

                            </div>


                            {/* ==================================================
                                SHIPPING ADDRESS
                            ================================================== */}

                            <div className="admin-order-section">

                                <div className="admin-section-title">
                                    SHIPPING ADDRESS
                                </div>

                                <div className="shipping-address">

                                    <strong>
                                        {
                                            order.shippingAddress
                                                ?.fullName
                                        }
                                    </strong>

                                    <p>
                                        {
                                            order.shippingAddress
                                                ?.address
                                        }
                                    </p>

                                    <p>
                                        {
                                            order.shippingAddress
                                                ?.city
                                        }
                                        ,{" "}
                                        {
                                            order.shippingAddress
                                                ?.state
                                        }
                                    </p>

                                    <p>
                                        {
                                            order.shippingAddress
                                                ?.postalCode
                                        }
                                    </p>

                                </div>

                            </div>


                            {/* ==================================================
                                PRODUCTS
                            ================================================== */}

                            <div className="admin-order-section">

                                <div className="admin-section-title">
                                    PRODUCTS
                                </div>

                                <div className="admin-order-products">

                                    {order.items.map(
                                        (item, index) => (

                                            <div
                                                className="admin-order-product"
                                                key={
                                                    item._id ||
                                                    index
                                                }
                                            >

                                                <div className="product-details">

                                                    <strong>
                                                        {item.name}
                                                    </strong>

                                                    <span>
                                                        ₹
                                                        {Number(
                                                            item.price || 0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}{" "}
                                                        ×{" "}
                                                        {item.quantity}
                                                    </span>

                                                </div>

                                                <strong className="product-subtotal">
                                                    ₹
                                                    {Number(
                                                        item.price *
                                                        item.quantity
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </strong>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>


                            {/* ==================================================
                                RETURN INFORMATION
                            ================================================== */}

                            {order.returnStatus !== "none" && (

                                <div className="admin-order-section return-section">

                                    <div className="admin-section-title">
                                        RETURN INFORMATION
                                    </div>

                                    <div className="return-info">

                                        <p>
                                            <span>
                                                Return Status
                                            </span>

                                            <strong>
                                                {
                                                    order.returnStatus
                                                }
                                            </strong>
                                        </p>

                                        <p>
                                            <span>
                                                Return Reason
                                            </span>

                                            <strong>
                                                {
                                                    order.returnReason ||
                                                    "Not provided"
                                                }
                                            </strong>
                                        </p>

                                    </div>

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default AdminOrders;