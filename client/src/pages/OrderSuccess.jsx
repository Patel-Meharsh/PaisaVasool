import { Link, useParams } from "react-router-dom";

function OrderSuccess() {
    const { id } = useParams();

    return (
        <div>

            <h1>Order Placed Successfully! 🎉</h1>

            <p>
                Thank you for shopping with PaisaVasool.
            </p>

            <p>
                Your Order ID:
            </p>

            <p>
                <strong>{id}</strong>
            </p>

            <br />

            <Link to="/orders">
                View My Orders
            </Link>

            <br />
            <br />

            <Link to="/products">
                Continue Shopping
            </Link>

        </div>
    );
}

export default OrderSuccess;