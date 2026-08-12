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

            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(

                "http://localhost:5000/api/orders/admin/all",

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
                    "Failed to fetch orders"
                );

            }


            setOrders(
                data.orders || []
            );


        } catch (error) {

            console.error(
                "Admin orders error:",
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
    // LOAD ORDERS
    // ============================================================

    useEffect(() => {

        fetchOrders();

    }, []);


    // ============================================================
    // UPDATE ORDER STATUS
    // ============================================================

    const handleStatusChange = async (
        orderId,
        newStatus
    ) => {

        try {

            setUpdatingOrderId(orderId);

            setError("");


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(

                `http://localhost:5000/api/orders/admin/${orderId}/status`,

                {
                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({
                        status: newStatus
                    })

                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update order status"
                );

            }


            // ----------------------------------------------------
            // Update order directly in the UI
            // ----------------------------------------------------

            setOrders((previousOrders) =>

                previousOrders.map((order) =>

                    order._id === orderId

                        ? {
                            ...order,
                            status:
                                data.order.status
                        }

                        : order

                )

            );


        } catch (error) {

            console.error(
                "Update order status error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setUpdatingOrderId(null);

        }

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div>

                <h2>
                    Loading orders...
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

            <Link to="/admin">
                ← Back to Dashboard
            </Link>


            <h1>
                Admin Orders
            </h1>


            <p>
                Manage all PaisaVasool customer orders.
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
                NO ORDERS
            ================================================== */}

            {orders.length === 0 ? (

                <h2>
                    No orders found.
                </h2>

            ) : (

                <div>

                    {/* ==================================================
                        ORDERS
                    ================================================== */}

                    {orders.map((order) => (

                        <div
                            key={order._id}
                        >

                            <hr />


                            {/* ==========================================
                                ORDER INFORMATION
                            ========================================== */}

                            <h2>
                                Order #{order._id}
                            </h2>


                            <p>
                                Date:{" "}

                                {new Date(
                                    order.createdAt
                                ).toLocaleString()}
                            </p>


                            {/* ==========================================
                                CUSTOMER
                            ========================================== */}

                            <h3>
                                Customer
                            </h3>


                            <p>
                                Name:{" "}

                                {order.user?.name ||
                                    "Unknown"}
                            </p>


                            <p>
                                Email:{" "}

                                {order.user?.email ||
                                    "Unknown"}
                            </p>


                            {/* ==========================================
                                PAYMENT
                            ========================================== */}

                            <h3>
                                Payment
                            </h3>


                            <p>
                                Method:{" "}

                                <strong>
                                    {order.paymentMethod}
                                </strong>
                            </p>


                            <p>
                                Payment Status:{" "}

                                <strong>
                                    {order.paymentStatus}
                                </strong>
                            </p>


                            {/* ==========================================
                                ORDER TOTAL
                            ========================================== */}

                            <h3>
                                Order Total
                            </h3>


                            <p>
                                ₹{order.totalAmount}
                            </p>


                            {/* ==========================================
                                ORDER STATUS
                            ========================================== */}

                            <h3>
                                Order Status
                            </h3>


                            <p>
                                Current Status:{" "}

                                <strong>
                                    {order.status}
                                </strong>
                            </p>


                            <select

                                value={
                                    order.status
                                }

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

                                <p>
                                    Updating status...
                                </p>

                            )}


                            {/* ==========================================
                                SHIPPING ADDRESS
                            ========================================== */}

                            <h3>
                                Shipping Address
                            </h3>


                            <p>
                                {order.shippingAddress?.fullName}
                            </p>


                            <p>
                                {order.shippingAddress?.address}
                            </p>


                            <p>
                                {order.shippingAddress?.city},{" "}

                                {order.shippingAddress?.state}
                            </p>


                            <p>
                                {order.shippingAddress?.postalCode}
                            </p>


                            {/* ==========================================
                                PRODUCTS
                            ========================================== */}

                            <h3>
                                Products
                            </h3>


                            {order.items.map(
                                (item, index) => (

                                <div
                                    key={
                                        item._id ||
                                        index
                                    }
                                >

                                    <p>
                                        {item.name}
                                    </p>

                                    <p>
                                        Price: ₹
                                        {item.price}
                                    </p>

                                    <p>
                                        Quantity:{" "}
                                        {item.quantity}
                                    </p>

                                    <p>
                                        Subtotal: ₹
                                        {
                                            item.price *
                                            item.quantity
                                        }
                                    </p>

                                </div>

                            ))}


                            {/* ==========================================
                                RETURN INFORMATION
                            ========================================== */}

                            {order.returnStatus !==
                                "none" && (

                                <div>

                                    <h3>
                                        Return Information
                                    </h3>


                                    <p>
                                        Return Status:{" "}

                                        <strong>
                                            {
                                                order.returnStatus
                                            }
                                        </strong>
                                    </p>


                                    <p>
                                        Return Reason:{" "}

                                        {
                                            order.returnReason ||
                                            "Not provided"
                                        }
                                    </p>

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