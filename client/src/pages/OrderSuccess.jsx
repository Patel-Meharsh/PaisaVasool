import { Link, useParams } from "react-router-dom";

function OrderSuccess() {

    const { id } = useParams();

    return (
        <div className="order-success-page">

            <div className="order-success-card">

                <div className="order-success-icon">
                    ✓
                </div>

                <h1>
                    Order Placed Successfully!
                </h1>

                <p className="order-success-message">
                    Thank you for shopping with PaisaVasool.
                    Your order has been confirmed successfully.
                </p>

                <div className="order-id-section">

                    <p>
                        Your Order ID
                    </p>

                    <strong>
                        {id}
                    </strong>

                </div>

                <div className="order-success-actions">

                    <Link
                        to="/orders"
                        className="order-orders-button"
                    >
                        View My Orders
                    </Link>

                    <Link
                        to="/products"
                        className="order-shopping-button"
                    >
                        Continue Shopping
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default OrderSuccess;