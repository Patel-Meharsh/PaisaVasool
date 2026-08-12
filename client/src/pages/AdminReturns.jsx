import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminReturns() {

    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [returns, setReturns] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState(null);


    // ============================================================
    // FETCH RETURN REQUESTS
    // ============================================================

    const fetchReturns = async () => {

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
            // Fetch return requests
            // ----------------------------------------------------

            const response = await fetch(
                "http://localhost:5000/api/admin/returns",
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
                    "Failed to fetch return requests"
                );

            }


            // ----------------------------------------------------
            // Store returns
            // ----------------------------------------------------

            setReturns(
                data.returns || []
            );


        } catch (error) {

            console.error(
                "Fetch return requests error:",
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
    // LOAD RETURN REQUESTS
    // ============================================================

    useEffect(() => {

        fetchReturns();

    }, []);


    // ============================================================
    // APPROVE RETURN
    // ============================================================

    const handleApprove = async (orderId) => {

        try {

            setActionLoading(orderId);

            setError("");

            const token =
                localStorage.getItem("token");


            const response = await fetch(
                `http://localhost:5000/api/admin/returns/${orderId}/approve`,
                {
                    method: "PUT",

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
                    "Failed to approve return"
                );

            }


            // ----------------------------------------------------
            // Update only the selected order
            // ----------------------------------------------------

            setReturns(
                (previousReturns) =>

                    previousReturns.map(
                        (order) => {

                            if (
                                order._id === orderId
                            ) {

                                return {
                                    ...order,

                                    returnStatus:
                                        data.order.returnStatus,

                                    returnProcessedAt:
                                        new Date().toISOString()
                                };

                            }


                            return order;

                        }
                    )
            );


        } catch (error) {

            console.error(
                "Approve return error:",
                error
            );

            setError(
                error.message
            );


        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // REJECT RETURN
    // ============================================================

    const handleReject = async (orderId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to reject this return?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setActionLoading(orderId);

            setError("");

            const token =
                localStorage.getItem("token");


            const response = await fetch(
                `http://localhost:5000/api/admin/returns/${orderId}/reject`,
                {
                    method: "PUT",

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
                    "Failed to reject return"
                );

            }


            // ----------------------------------------------------
            // Update only the selected order
            // ----------------------------------------------------

            setReturns(
                (previousReturns) =>

                    previousReturns.map(
                        (order) => {

                            if (
                                order._id === orderId
                            ) {

                                return {
                                    ...order,

                                    returnStatus:
                                        data.order.returnStatus,

                                    returnProcessedAt:
                                        new Date().toISOString()
                                };

                            }


                            return order;

                        }
                    )
            );


        } catch (error) {

            console.error(
                "Reject return error:",
                error
            );

            setError(
                error.message
            );


        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // PROCESS REFUND
    // ============================================================

    const handleRefund = async (orderId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to process this refund?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setActionLoading(orderId);

            setError("");

            const token =
                localStorage.getItem("token");


            const response = await fetch(
                `http://localhost:5000/api/admin/returns/${orderId}/refund`,
                {
                    method: "POST",

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
                    "Failed to process refund"
                );

            }


            // ----------------------------------------------------
            // Update only the selected order
            // ----------------------------------------------------

            setReturns(
                (previousReturns) =>

                    previousReturns.map(
                        (order) => {

                            if (
                                order._id === orderId
                            ) {

                                return {
                                    ...order,

                                    returnStatus:
                                        data.order.returnStatus,

                                    refundStatus:
                                        data.order.refundStatus,

                                    paymentStatus:
                                        data.order.paymentStatus
                                };

                            }


                            return order;

                        }
                    )
            );


        } catch (error) {

            console.error(
                "Refund error:",
                error
            );

            setError(
                error.message
            );


        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // LOADING SCREEN
    // ============================================================

    if (loading) {

        return (

            <div>

                <h2>
                    Loading return requests...
                </h2>

            </div>

        );

    }


    // ============================================================
    // MAIN UI
    // ============================================================

    return (

        <div>

            {/* ==================================================
                BACK TO ADMIN DASHBOARD
            ================================================== */}

            <Link to="/admin">
                ← Back to Admin Dashboard
            </Link>


            {/* ==================================================
                PAGE TITLE
            ================================================== */}

            <h1>
                Return & Refund Management
            </h1>


            <p>
                Manage customer return requests and refunds.
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
                NO RETURN REQUESTS
            ================================================== */}

            {returns.length === 0 ? (

                <div>

                    <h2>
                        No return requests found.
                    </h2>

                </div>

            ) : (

                <div>

                    {/* ==================================================
                        EACH RETURN REQUEST
                    ================================================== */}

                    {returns.map((order) => (

                        <div
                            key={order._id}
                            style={{
                                border: "1px solid #ccc",
                                padding: "20px",
                                marginBottom: "25px"
                            }}
                        >

                            {/* ==========================================
                                ORDER INFORMATION
                            ========================================== */}

                            <h2>
                                Order #{order._id}
                            </h2>


                            <p>
                                Order Date:{" "}
                                {new Date(
                                    order.createdAt
                                ).toLocaleString()}
                            </p>


                            <p>
                                Order Status:{" "}

                                <strong>
                                    {order.status}
                                </strong>
                            </p>


                            {/* ==========================================
                                CUSTOMER INFORMATION
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
                                RETURN INFORMATION
                            ========================================== */}

                            <h3>
                                Return Information
                            </h3>


                            <p>
                                Return Status:{" "}

                                <strong>
                                    {order.returnStatus}
                                </strong>
                            </p>


                            <p>
                                Return Reason:{" "}

                                {order.returnReason ||
                                    "No reason provided"}
                            </p>


                            {order.returnRequestedAt && (

                                <p>
                                    Requested At:{" "}

                                    {new Date(
                                        order.returnRequestedAt
                                    ).toLocaleString()}
                                </p>

                            )}


                            {order.returnProcessedAt && (

                                <p>
                                    Processed At:{" "}

                                    {new Date(
                                        order.returnProcessedAt
                                    ).toLocaleString()}
                                </p>

                            )}


                            {/* ==========================================
                                PAYMENT INFORMATION
                            ========================================== */}

                            <h3>
                                Payment Information
                            </h3>


                            <p>
                                Payment Method:{" "}

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


                            <p>
                                Refund Status:{" "}

                                <strong>
                                    {order.refundStatus}
                                </strong>
                            </p>


                            <p>
                                Order Amount:{" "}

                                <strong>
                                    ₹{order.totalAmount}
                                </strong>
                            </p>


                            {/* ==========================================
                                PRODUCTS
                            ========================================== */}

                            <h3>
                                Products
                            </h3>


                            <div>

                                {order.items.map(
                                    (item, index) => (

                                        <div
                                            key={
                                                item._id ||
                                                index
                                            }
                                            style={{
                                                marginBottom:
                                                    "15px"
                                            }}
                                        >

                                            <p>
                                                <strong>
                                                    {item.name}
                                                </strong>
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
                                                {item.price *
                                                    item.quantity}
                                            </p>


                                        </div>

                                    )
                                )}

                            </div>


                            {/* ==========================================
                                APPROVE / REJECT RETURN
                            ========================================== */}

                            {order.returnStatus ===
                                "requested" && (

                                <div
                                    style={{
                                        marginTop:
                                            "20px"
                                    }}
                                >

                                    <button
                                        onClick={() =>
                                            handleApprove(
                                                order._id
                                            )
                                        }
                                        disabled={
                                            actionLoading ===
                                            order._id
                                        }
                                    >

                                        {actionLoading ===
                                        order._id

                                            ? "Processing..."

                                            : "Approve Return"}

                                    </button>


                                    {" "}


                                    <button
                                        onClick={() =>
                                            handleReject(
                                                order._id
                                            )
                                        }
                                        disabled={
                                            actionLoading ===
                                            order._id
                                        }
                                    >

                                        {actionLoading ===
                                        order._id

                                            ? "Processing..."

                                            : "Reject Return"}

                                    </button>

                                </div>

                            )}


                            {/* ==========================================
                                APPROVED RETURN
                            ========================================== */}

                            {order.returnStatus ===
                                "approved" && (

                                <div
                                    style={{
                                        marginTop:
                                            "20px"
                                    }}
                                >

                                    <p>
                                        Return approved.
                                    </p>

                                </div>

                            )}


                            {/* ==========================================
                                ONLINE PAYMENT REFUND
                            ========================================== */}

                            {order.returnStatus ===
                                "approved" &&

                            order.paymentMethod ===
                                "online" &&

                            order.paymentStatus ===
                                "paid" && (

                                <div
                                    style={{
                                        marginTop:
                                            "15px"
                                    }}
                                >

                                    <button
                                        onClick={() =>
                                            handleRefund(
                                                order._id
                                            )
                                        }
                                        disabled={
                                            actionLoading ===
                                            order._id
                                        }
                                    >

                                        {actionLoading ===
                                        order._id

                                            ? "Processing Refund..."

                                            : "Process Refund"}

                                    </button>

                                </div>

                            )}


                            {/* ==========================================
                                COD RETURN
                            ========================================== */}

                            {order.returnStatus ===
                                "approved" &&

                            order.paymentMethod ===
                                "cod" && (

                                <div
                                    style={{
                                        marginTop:
                                            "15px"
                                    }}
                                >

                                    <p>
                                        This is a Cash on Delivery
                                        order. Razorpay refund is
                                        not available.
                                    </p>

                                </div>

                            )}


                            {/* ==========================================
                                REFUND PROCESSED
                            ========================================== */}

                            {order.refundStatus ===
                                "processed" && (

                                <div
                                    style={{
                                        marginTop:
                                            "15px"
                                    }}
                                >

                                    <p>
                                        Refund processed
                                        successfully.
                                    </p>

                                    {order.razorpayRefundId && (

                                        <p>
                                            Razorpay Refund ID:{" "}
                                            <strong>
                                                {
                                                    order.razorpayRefundId
                                                }
                                            </strong>
                                        </p>

                                    )}

                                </div>

                            )}


                            {/* ==========================================
                                RETURN COMPLETED
                            ========================================== */}

                            {order.returnStatus ===
                                "received" && (

                                <div
                                    style={{
                                        marginTop:
                                            "15px"
                                    }}
                                >

                                    <p>
                                        Return and refund
                                        process completed.
                                    </p>

                                </div>

                            )}


                            {/* ==========================================
                                RETURN REJECTED
                            ========================================== */}

                            {order.returnStatus ===
                                "rejected" && (
                                <div
                                    style={{
                                        marginTop:
                                            "15px"
                                    }}
                                >
                                    <p>
                                        This return request
                                        was rejected.
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
export default AdminReturns;