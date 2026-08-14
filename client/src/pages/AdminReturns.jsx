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

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/admin/returns",
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
                    data.message ||
                    "Failed to fetch return requests"
                );
            }

            setReturns(data.returns || []);

        } catch (error) {
            console.error(
                "Fetch return requests error:",
                error
            );

            setError(error.message);

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

            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/admin/returns/${orderId}/approve`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to approve return"
                );
            }

            setReturns((previousReturns) =>
                previousReturns.map((order) => {
                    if (order._id === orderId) {
                        return {
                            ...order,
                            returnStatus:
                                data.order.returnStatus,
                            returnProcessedAt:
                                new Date().toISOString()
                        };
                    }

                    return order;
                })
            );

        } catch (error) {
            console.error(
                "Approve return error:",
                error
            );

            setError(error.message);

        } finally {
            setActionLoading(null);
        }
    };

    // ============================================================
    // REJECT RETURN
    // ============================================================

    const handleReject = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to reject this return?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(orderId);
            setError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/admin/returns/${orderId}/reject`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to reject return"
                );
            }

            setReturns((previousReturns) =>
                previousReturns.map((order) => {
                    if (order._id === orderId) {
                        return {
                            ...order,
                            returnStatus:
                                data.order.returnStatus,
                            returnProcessedAt:
                                new Date().toISOString()
                        };
                    }

                    return order;
                })
            );

        } catch (error) {
            console.error(
                "Reject return error:",
                error
            );

            setError(error.message);

        } finally {
            setActionLoading(null);
        }
    };

    // ============================================================
    // PROCESS REFUND
    // ============================================================

    const handleRefund = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to process this refund?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(orderId);
            setError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/admin/returns/${orderId}/refund`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to process refund"
                );
            }

            setReturns((previousReturns) =>
                previousReturns.map((order) => {
                    if (order._id === orderId) {
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
                })
            );

        } catch (error) {
            console.error(
                "Refund error:",
                error
            );

            setError(error.message);

        } finally {
            setActionLoading(null);
        }
    };

    // ============================================================
    // LOADING SCREEN
    // ============================================================

    if (loading) {
        return (
            <div className="admin-page admin-loading-page">
                <div className="admin-loading-card">
                    <h2>
                        Loading return requests...
                    </h2>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN UI
    // ============================================================

    return (
        <div className="admin-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="admin-page-header">

                <div>
                    <Link
                        to="/admin"
                        className="admin-back-link"
                    >
                        ← Back to Dashboard
                    </Link>

                    <h1>
                        Return & Refund Management
                    </h1>

                    <p>
                        Manage customer return requests
                        and refunds.
                    </p>
                </div>

            </div>

            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (
                <div className="admin-error">
                    {error}
                </div>
            )}

            {/* ====================================================
                NO RETURN REQUESTS
            ==================================================== */}

            {returns.length === 0 ? (

                <div className="admin-empty-state">

                    <h2>
                        No return requests found.
                    </h2>

                    <p>
                        There are currently no customer
                        return requests to manage.
                    </p>

                </div>

            ) : (

                <div className="admin-returns-list">

                    {/* ==================================================
                        EACH RETURN REQUEST
                    ================================================== */}

                    {returns.map((order) => (

                        <div
                            className="admin-return-card"
                            key={order._id}
                        >

                            {/* ==========================================
                                CARD HEADER
                            ========================================== */}

                            <div className="admin-return-header">

                                <div>
                                    <h2>
                                        Order #{order._id}
                                    </h2>

                                    <p>
                                        Order Date:{" "}
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                <span
                                    className={`return-status return-status-${order.returnStatus}`}
                                >
                                    {order.returnStatus}
                                </span>

                            </div>

                            {/* ==========================================
                                ORDER STATUS
                            ========================================== */}

                            <div className="admin-return-section">

                                <h3>
                                    Order Information
                                </h3>

                                <div className="admin-info-grid">

                                    <div>
                                        <span>
                                            Order Status
                                        </span>

                                        <strong>
                                            {order.status}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Order Amount
                                        </span>

                                        <strong>
                                            ₹
                                            {Number(
                                                order.totalAmount || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* ==========================================
                                CUSTOMER INFORMATION
                            ========================================== */}

                            <div className="admin-return-section">

                                <h3>
                                    Customer
                                </h3>

                                <div className="admin-info-grid">

                                    <div>
                                        <span>
                                            Name
                                        </span>

                                        <strong>
                                            {order.user?.name ||
                                                "Unknown"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {order.user?.email ||
                                                "Unknown"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* ==========================================
                                RETURN INFORMATION
                            ========================================== */}

                            <div className="admin-return-section">

                                <h3>
                                    Return Information
                                </h3>

                                <div className="admin-info-grid">

                                    <div>
                                        <span>
                                            Return Status
                                        </span>

                                        <strong
                                            className={`return-status-text return-status-text-${order.returnStatus}`}
                                        >
                                            {order.returnStatus}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Return Reason
                                        </span>

                                        <strong>
                                            {order.returnReason ||
                                                "No reason provided"}
                                        </strong>
                                    </div>

                                    {order.returnRequestedAt && (
                                        <div>
                                            <span>
                                                Requested At
                                            </span>

                                            <strong>
                                                {new Date(
                                                    order.returnRequestedAt
                                                ).toLocaleString()}
                                            </strong>
                                        </div>
                                    )}

                                    {order.returnProcessedAt && (
                                        <div>
                                            <span>
                                                Processed At
                                            </span>

                                            <strong>
                                                {new Date(
                                                    order.returnProcessedAt
                                                ).toLocaleString()}
                                            </strong>
                                        </div>
                                    )}

                                </div>

                            </div>

                            {/* ==========================================
                                PAYMENT INFORMATION
                            ========================================== */}

                            <div className="admin-return-section">

                                <h3>
                                    Payment Information
                                </h3>

                                <div className="admin-info-grid">

                                    <div>
                                        <span>
                                            Payment Method
                                        </span>

                                        <strong>
                                            {order.paymentMethod}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Payment Status
                                        </span>

                                        <strong>
                                            {order.paymentStatus}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Refund Status
                                        </span>

                                        <strong>
                                            {order.refundStatus}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Amount
                                        </span>

                                        <strong>
                                            ₹
                                            {Number(
                                                order.totalAmount || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* ==========================================
                                PRODUCTS
                            ========================================== */}

                            <div className="admin-return-section">

                                <h3>
                                    Products
                                </h3>

                                <div className="admin-return-products">

                                    {order.items.map(
                                        (item, index) => (

                                            <div
                                                className="admin-return-product"
                                                key={
                                                    item._id ||
                                                    index
                                                }
                                            >

                                                <div>
                                                    <strong>
                                                        {item.name}
                                                    </strong>

                                                    <p>
                                                        ₹
                                                        {Number(
                                                            item.price || 0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                        {" × "}
                                                        {item.quantity}
                                                    </p>
                                                </div>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        item.price || 0
                                                    ) *
                                                        Number(
                                                            item.quantity || 0
                                                        )}
                                                </strong>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                            {/* ==========================================
                                ACTIONS
                            ========================================== */}

                            <div className="admin-return-actions">

                                {/* APPROVE / REJECT */}

                                {order.returnStatus ===
                                    "requested" && (

                                    <>
                                        <button
                                            className="admin-btn admin-btn-success"
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

                                        <button
                                            className="admin-btn admin-btn-danger"
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
                                    </>
                                )}

                                {/* APPROVED */}

                                {order.returnStatus ===
                                    "approved" && (

                                    <div className="admin-return-message success">
                                        Return approved.
                                    </div>
                                )}

                                {/* ONLINE REFUND */}

                                {order.returnStatus ===
                                    "approved" &&
                                    order.paymentMethod ===
                                        "online" &&
                                    order.paymentStatus ===
                                        "paid" && (

                                    <button
                                        className="admin-btn admin-btn-primary"
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
                                )}

                                {/* COD */}

                                {order.returnStatus ===
                                    "approved" &&
                                    order.paymentMethod ===
                                        "cod" && (

                                    <div className="admin-return-message info">
                                        This is a Cash on Delivery
                                        order. Razorpay refund is
                                        not available.
                                    </div>
                                )}

                                {/* REFUND PROCESSED */}

                                {order.refundStatus ===
                                    "processed" && (

                                    <div className="admin-return-message success">

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

                                {/* RETURN COMPLETED */}

                                {order.returnStatus ===
                                    "received" && (

                                    <div className="admin-return-message success">
                                        Return and refund
                                        process completed.
                                    </div>
                                )}

                                {/* RETURN REJECTED */}

                                {order.returnStatus ===
                                    "rejected" && (

                                    <div className="admin-return-message danger">
                                        This return request
                                        was rejected.
                                    </div>
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default AdminReturns;