import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Orders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await fetch(
                    "http://localhost:5000/api/orders/my-orders",
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
                console.error("Orders error:", error);
                setError(error.message);

            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [navigate]);

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="orders-page">
                <h2>Loading orders...</h2>
            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error) {
        return (
            <div className="orders-page">
                <h2>{error}</h2>

                <button onClick={() => navigate("/products")}>
                    Continue Shopping
                </button>
            </div>
        );
    }

    // ============================================================
    // ORDERS PAGE
    // ============================================================

    return (
    <div className="orders-page">

        <div className="orders-header">

            <div>
                <h1>My Orders</h1>

                <p>
                    View and manage your recent purchases.
                </p>
            </div>

        </div>


        {orders.length === 0 ? (

            <div className="empty-orders">

                <div className="empty-orders-icon">
                    🛍
                </div>

                <h2>No Orders Yet</h2>

                <p>
                    You haven't placed any orders yet.
                    Start shopping and your orders will appear here.
                </p>

                <button
                    onClick={() => navigate("/products")}
                >
                    Start Shopping
                </button>

            </div>

        ) : (

            <div className="orders-list">

                {orders.map((order) => (

                    <div
                        className="order-card"
                        key={order._id}
                    >

                        <div className="order-card-header">

                            <div>

                                <span className="order-label">
                                    Order
                                </span>

                                <h3>
                                    #{order._id}
                                </h3>

                            </div>

                            <span
                                className={`order-status order-status-${order.status?.toLowerCase()}`}
                            >
                                {order.status}
                            </span>

                        </div>


                        <div className="order-card-body">

                            <div className="order-info">

                                <span>
                                    Items
                                </span>

                                <strong>
                                    {order.items?.length || 0}
                                    {order.items?.length === 1
                                        ? " Item"
                                        : " Items"}
                                </strong>

                            </div>


                            <div className="order-info">

                                <span>
                                    Total
                                </span>

                                <strong className="order-total">
                                    ₹{order.totalAmount}
                                </strong>

                            </div>


                            <div className="order-info">

                                <span>
                                    Payment
                                </span>

                                <strong>
                                    {order.paymentMethod}
                                </strong>

                            </div>


                            <div className="order-info">

                                <span>
                                    Payment Status
                                </span>

                                <strong
                                    className={`payment-status payment-${order.paymentStatus?.toLowerCase()}`}
                                >
                                    {order.paymentStatus}
                                </strong>

                            </div>

                        </div>


                        <div className="order-card-footer">

                            <span className="order-status-text">

                                Order Status:
                                <strong>
                                    {order.status}
                                </strong>

                            </span>


                            <Link
                                to={`/orders/${order._id}`}
                                className="view-order-button"
                            >
                                View Order
                                <span>→</span>
                            </Link>

                        </div>

                    </div>

                ))}

            </div>

        )}

    </div>
);
}

export default Orders;