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

            {/* Back */}

            <Link to="/orders">
                ← Back to My Orders
            </Link>

            {/* Order Header */}

            <h1>
                Order Details
            </h1>

            <h2>
                Order #{order._id}
            </h2>

            {/* Order Information */}

            <div className="order-information">

                <p>
                    <strong>Status:</strong>{" "}
                    {order.status}
                </p>

                <p>
                    <strong>Payment Method:</strong>{" "}
                    {order.paymentMethod}
                </p>

                <p>
                    <strong>Payment Status:</strong>{" "}
                    {order.paymentStatus}
                </p>

                <p>
                    <strong>Total Items:</strong>{" "}
                    {totalItems}
                </p>

            </div>

            {/* Cancel Order */}

            {canCancel && (

                <div className="cancel-order-section">

                    <button
                        onClick={handleCancelOrder}
                        disabled={cancelLoading}
                    >
                        {cancelLoading
                            ? "Cancelling..."
                            : "Cancel Order"}
                    </button>

                </div>

            )}

            {cancelError && (
                <p>{cancelError}</p>
            )}

            {/* Return Section */}

            {order.status === "delivered" && (

                <div className="return-section">

                    <h2>
                        Return
                    </h2>

                    {order.returnStatus !== "none" ? (

                        <div>

                            <p>
                                <strong>
                                    Return Status:
                                </strong>{" "}
                                {order.returnStatus}
                            </p>

                            {order.returnReason && (

                                <p>
                                    <strong>
                                        Return Reason:
                                    </strong>{" "}
                                    {order.returnReason}
                                </p>

                            )}

                        </div>

                    ) : (

                        <div>

                            <p>
                                If you want to return this
                                order, please provide a reason.
                            </p>

                            <textarea
                                value={returnReason}
                                onChange={(event) =>
                                    setReturnReason(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter return reason"
                                rows="4"
                            />

                            <br />
                            <br />

                            <button
                                onClick={handleRequestReturn}
                                disabled={
                                    returnLoading ||
                                    !canRequestReturn
                                }
                            >
                                {returnLoading
                                    ? "Submitting..."
                                    : "Request Return"}
                            </button>

                        </div>

                    )}

                    {returnError && (
                        <p>{returnError}</p>
                    )}

                    {returnSuccess && (
                        <p>{returnSuccess}</p>
                    )}

                </div>

            )}

            {/* Products */}

            <div className="order-items">

                <h2>
                    Products
                </h2>

                {order.items.map((item) => (

                    <div
                        className="order-item"
                        key={item._id}
                    >

                        <h3>
                            {item.name}
                        </h3>

                        {item.product?.images &&
                        item.product.images.length > 0 ? (

                            <img
                                src={
                                    item.product.images[0]
                                }
                                alt={item.name}
                                width="150"
                            />

                        ) : (

                            <p>
                                No Image
                            </p>

                        )}

                        <p>
                            Price: ₹{item.price}
                        </p>

                        <p>
                            Quantity: {item.quantity}
                        </p>

                        <p>
                            Subtotal: ₹
                            {item.price *
                                item.quantity}
                        </p>

                    </div>

                ))}

            </div>

            {/* Total */}

            <h2>
                Total: ₹{order.totalAmount}
            </h2>

            {/* Shipping Address */}

            <div className="shipping-address">

                <h2>
                    Shipping Address
                </h2>

                <p>
                    {order.shippingAddress.fullName}
                </p>

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

            {/* Cancelled */}

            {order.status === "cancelled" && (

                <p>
                    This order has been cancelled.
                </p>

            )}

        </div>
    );
}

export default OrderDetails;