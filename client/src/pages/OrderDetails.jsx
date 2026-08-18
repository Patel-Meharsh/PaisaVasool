import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function OrderDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [cancelLoading, setCancelLoading] = useState(false);

    const [returnLoading, setReturnLoading] = useState(false);

    const [error, setError] = useState("");

    const [cancelError, setCancelError] = useState("");

    const [returnError, setReturnError] = useState("");

    const [returnReason, setReturnReason] = useState("");

    const [returnSuccess, setReturnSuccess] = useState("");

    // ============================================================
    // FETCH ORDER
    // ============================================================

    useEffect(() => {

        const fetchOrder = async () => {

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await fetch(
                    `http://localhost:5000/api/orders/${id}`,
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
                        "Failed to fetch order"
                    );
                }

                setOrder(data.order);

            } catch (error) {

                console.error(
                    "Order details error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);

            }

        };

        fetchOrder();

    }, [id, navigate]);

    // ============================================================
    // CANCEL ORDER
    // ============================================================

    const handleCancelOrder = async () => {

        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setCancelLoading(true);
            setCancelError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                `http://localhost:5000/api/orders/${id}/cancel`,
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
                    "Failed to cancel order"
                );
            }

            setOrder(data.order);

        } catch (error) {

            console.error(
                "Cancel order error:",
                error
            );

            setCancelError(error.message);

        } finally {

            setCancelLoading(false);

        }
    };

    // ============================================================
    // REQUEST RETURN
    // ============================================================

    const handleRequestReturn = async () => {

        setReturnError("");
        setReturnSuccess("");

        if (!returnReason.trim()) {

            setReturnError(
                "Please enter a reason for the return."
            );

            return;
        }

        try {

            setReturnLoading(true);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await fetch(
                `http://localhost:5000/api/orders/${id}/return`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        reason: returnReason.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to request return"
                );
            }

            setOrder((previousOrder) => ({
                ...previousOrder,

                returnStatus:
                    data.returnRequest.returnStatus,

                returnReason:
                    data.returnRequest.reason,

                returnRequestedAt:
                    data.returnRequest.requestedAt
            }));

            setReturnSuccess(
                data.message ||
                "Return request submitted successfully"
            );

            setReturnReason("");

        } catch (error) {

            console.error(
                "Return request error:",
                error
            );

            setReturnError(error.message);

        } finally {

            setReturnLoading(false);

        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div className="order-details-page">
                <h2>Loading order...</h2>
            </div>
        );

    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (
            <div className="order-details-page">

                <h2>{error}</h2>

                <Link to="/orders">
                    ← Back to My Orders
                </Link>

            </div>
        );

    }

    // ============================================================
    // ORDER NOT FOUND
    // ============================================================

    if (!order) {

        return (
            <div className="order-details-page">

                <h2>Order not found.</h2>

                <Link to="/orders">
                    ← Back to My Orders
                </Link>

            </div>
        );

    }

    // ============================================================
    // CALCULATE TOTAL ITEMS
    // ============================================================

    const totalItems = order.items.reduce(
        (total, item) => {
            return total + item.quantity;
        },
        0
    );

    // ============================================================
    // ORDER ACTION CONDITIONS
    // ============================================================

    const canCancel =
        order.status === "pending" ||
        order.status === "confirmed";

    const canRequestReturn =
        order.status === "delivered" &&
        order.returnStatus === "none";

    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="order-details-page">

            {/* ====================================================
                BACK TO ORDERS
            ==================================================== */}

            <Link
                to="/orders"
                className="order-details-back"
            >
                ← Back to My Orders
            </Link>


            {/* ====================================================
                PAGE HEADER
            ==================================================== */}

            <div className="order-details-header">

                <div>

                    <span className="order-details-label">
                        Order Details
                    </span>

                    <h1>
                        Order #{order._id}
                    </h1>

                </div>

                <span
                    className={`order-details-status order-status-${order.status?.toLowerCase()}`}
                >
                    {order.status}
                </span>

            </div>


            {/* ====================================================
                ORDER INFORMATION
            ==================================================== */}

            <div className="order-information">

                <div className="order-information-item">

                    <span>
                        Order Status
                    </span>

                    <strong
                        className={`detail-status detail-status-${order.status?.toLowerCase()}`}
                    >
                        {order.status}
                    </strong>

                </div>


                <div className="order-information-item">

                    <span>
                        Payment Method
                    </span>

                    <strong>
                        {order.paymentMethod}
                    </strong>

                </div>


                <div className="order-information-item">

                    <span>
                        Payment Status
                    </span>

                    <strong
                        className={`detail-status detail-payment-${order.paymentStatus?.toLowerCase()}`}
                    >
                        {order.paymentStatus}
                    </strong>

                </div>


                <div className="order-information-item">

                    <span>
                        Total Items
                    </span>

                    <strong>
                        {totalItems}
                        {totalItems === 1
                            ? " Item"
                            : " Items"}
                    </strong>

                </div>

            </div>


            {/* ====================================================
                CANCEL ERROR
            ==================================================== */}

            {cancelError && (

                <div className="order-details-error">
                    {cancelError}
                </div>

            )}


            {/* ====================================================
                CANCEL ORDER
            ==================================================== */}

            {canCancel && (

                <div className="cancel-order-section">

                    <div>

                        <h3>
                            Cancel Order
                        </h3>

                        <p>
                            You can cancel this order while it is
                            still being processed.
                        </p>

                    </div>

                    <button
                        onClick={handleCancelOrder}
                        disabled={cancelLoading}
                        className="cancel-order-button"
                    >
                        {cancelLoading
                            ? "Cancelling..."
                            : "Cancel Order"}
                    </button>

                </div>

            )}


            {/* ====================================================
                PRODUCTS
            ==================================================== */}

            <div className="order-items">

                <div className="section-heading">

                    <div>

                        <h2>
                            Products
                        </h2>

                        <p>
                            {totalItems}
                            {totalItems === 1
                                ? " item"
                                : " items"} in this order
                        </p>

                    </div>

                </div>


                <div className="order-items-list">

                    {order.items.map((item) => {

                        const image =
                            item.images?.[0] ||
                            item.product?.images?.[0];

                        return (

                            <div
                                className="order-item"
                                key={item._id}
                            >

                                {/* Product Image */}

                                <div className="order-item-image">

                                    {image ? (

                                        <img
                                            src={image}
                                            alt={item.name}
                                            loading="lazy"
                                            decoding="async"
                                        />

                                    ) : (

                                        <span>
                                            No Image
                                        </span>

                                    )}

                                </div>


                                {/* Product Details */}

                                <div className="order-item-info">

                                    <h3>
                                        {item.name}
                                    </h3>

                                    <p>
                                        Price: ₹{item.price}
                                    </p>

                                    <p>
                                        Quantity: {item.quantity}
                                    </p>

                                </div>


                                {/* Product Subtotal */}

                                <div className="order-item-price">

                                    <span>
                                        Subtotal
                                    </span>

                                    <strong>
                                        ₹{item.price * item.quantity}
                                    </strong>

                                </div>

                            </div>

                        );
                    })}

                </div>

            </div>


            {/* ====================================================
                ORDER TOTAL
            ==================================================== */}

            <div className="order-total-section">

                <span>
                    Order Total
                </span>

                <strong>
                    ₹{order.totalAmount}
                </strong>

            </div>


            {/* ====================================================
                SHIPPING ADDRESS
            ==================================================== */}

            <div className="shipping-address">

                <div className="section-heading">

                    <div>

                        <h2>
                            Shipping Address
                        </h2>

                        <p>
                            Delivery information
                        </p>

                    </div>

                </div>


                <div className="shipping-address-content">

                    <strong>
                        {order.shippingAddress.fullName}
                    </strong>

                    <p>
                        {order.shippingAddress.address}
                    </p>

                    <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}
                    </p>

                    <p>
                        {order.shippingAddress.postalCode}
                    </p>

                    <p>
                        {order.shippingAddress.country}
                    </p>

                </div>

            </div>


            {/* ====================================================
                RETURN SECTION
            ==================================================== */}

            {order.status === "delivered" && (

                <div className="return-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Return
                            </h2>

                            <p>
                                Manage your return request
                            </p>

                        </div>

                    </div>


                    {order.returnStatus !== "none" ? (

                        <div className="return-status-card">

                            <div className="return-status-row">

                                <span>
                                    Return Status
                                </span>

                                <strong
                                    className={`return-status return-${order.returnStatus?.toLowerCase()}`}
                                >
                                    {order.returnStatus}
                                </strong>

                            </div>


                            {order.returnReason && (

                                <div className="return-reason">

                                    <span>
                                        Return Reason
                                    </span>

                                    <p>
                                        {order.returnReason}
                                    </p>

                                </div>

                            )}

                        </div>

                    ) : (

                        <div className="return-request-form">

                            <p>
                                If you want to return this delivered
                                order, please provide a reason below.
                            </p>


                            <textarea
                                value={returnReason}
                                onChange={(event) =>
                                    setReturnReason(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your return reason..."
                                rows="4"
                            />


                            {returnError && (

                                <div className="return-error">
                                    {returnError}
                                </div>

                            )}


                            {returnSuccess && (

                                <div className="return-success">
                                    {returnSuccess}
                                </div>

                            )}


                            <button
                                onClick={handleRequestReturn}
                                disabled={
                                    returnLoading ||
                                    !canRequestReturn
                                }
                                className="return-button"
                            >
                                {returnLoading
                                    ? "Submitting..."
                                    : "Request Return"}
                            </button>

                        </div>

                    )}

                </div>

            )}


            {/* ====================================================
                CANCELLED ORDER
            ==================================================== */}

            {order.status === "cancelled" && (

                <div className="cancelled-order-message">

                    <strong>
                        This order has been cancelled.
                    </strong>

                    <p>
                        No further actions are available for
                        this order.
                    </p>

                </div>

            )}

        </div>

    );
}

export default OrderDetails;
