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

            <h1>My Orders</h1>

            {orders.length === 0 ? (

                <div className="empty-orders">

                    <p>
                        You have not placed any orders yet.
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

                            <h3>
                                Order #{order._id}
                            </h3>

                            <p>
                                <strong>Total:</strong>{" "}
                                ₹{order.totalAmount}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {order.status}
                            </p>

                            <p>
                                <strong>Payment:</strong>{" "}
                                {order.paymentMethod}
                            </p>

                            <p>
                                <strong>Payment Status:</strong>{" "}
                                {order.paymentStatus}
                            </p>

                            <p>
                                <strong>Items:</strong>{" "}
                                {order.items?.length || 0}
                            </p>

                            <Link
                                to={`/orders/${order._id}`}
                            >
                                View Order
                            </Link>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default Orders;