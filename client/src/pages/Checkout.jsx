import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Checkout() {

    const navigate = useNavigate();

    // ============================================================
    // SHIPPING ADDRESS
    // ============================================================

    const [shippingAddress, setShippingAddress] =
        useState({
            fullName: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India"
        });

    // ============================================================
    // PAYMENT METHOD
    // ============================================================

    const [paymentMethod, setPaymentMethod] =
        useState("cod");

    // ============================================================
    // UI STATES
    // ============================================================

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // ============================================================
    // HANDLE INPUT
    // ============================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setShippingAddress(
            (previousAddress) => ({
                ...previousAddress,
                [name]: value
            })
        );
    };

    // ============================================================
    // LOAD RAZORPAY
    // ============================================================

    const loadRazorpayScript = () => {

        return new Promise((resolve) => {

            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => {
                resolve(true);
            };

            script.onerror = () => {
                resolve(false);
            };

            document.body.appendChild(script);
        });
    };

    // ============================================================
    // ONLINE PAYMENT
    // ============================================================

    const handleOnlinePayment = async (
        paisaVasoolOrderId,
        token
    ) => {

        // --------------------------------------------------------
        // LOAD RAZORPAY
        // --------------------------------------------------------

        const razorpayLoaded =
            await loadRazorpayScript();

        if (!razorpayLoaded) {

            throw new Error(
                "Failed to load Razorpay."
            );

        }

        // --------------------------------------------------------
        // CREATE RAZORPAY ORDER
        // --------------------------------------------------------

        const razorpayOrderResponse =
            await fetch(
                "http://localhost:5000/api/payments/create-order",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        orderId:
                            paisaVasoolOrderId
                    })
                }
            );

        const razorpayOrderData =
            await razorpayOrderResponse.json();

        if (!razorpayOrderResponse.ok) {

            throw new Error(
                razorpayOrderData.message ||
                "Failed to create Razorpay order"
            );

        }

        // --------------------------------------------------------
        // RAZORPAY OPTIONS
        // --------------------------------------------------------

        const options = {

            key:
                import.meta.env
                    .VITE_RAZORPAY_KEY_ID,

            amount:
                razorpayOrderData
                    .razorpayOrder.amount,

            currency:
                razorpayOrderData
                    .razorpayOrder.currency,

            name:
                "PaisaVasool",

            description:
                "PaisaVasool Order Payment",

            order_id:
                razorpayOrderData
                    .razorpayOrder.id,

            prefill: {
                name:
                    shippingAddress.fullName
            },

            theme: {
                color: "#3399cc"
            },

            // ----------------------------------------------------
            // SUCCESS
            // ----------------------------------------------------

            handler: async (response) => {

                try {

                    setLoading(true);
                    setError("");

                    const verifyResponse =
                        await fetch(
                            "http://localhost:5000/api/payments/verify",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Authorization:
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({

                                    orderId:
                                        paisaVasoolOrderId,

                                    razorpayOrderId:
                                        response.razorpay_order_id,

                                    razorpayPaymentId:
                                        response.razorpay_payment_id,

                                    razorpaySignature:
                                        response.razorpay_signature

                                })
                            }
                        );

                    const verifyData =
                        await verifyResponse.json();

                    if (!verifyResponse.ok) {

                        throw new Error(
                            verifyData.message ||
                            "Payment verification failed"
                        );

                    }

                    navigate(
                        `/order-success/${paisaVasoolOrderId}`
                    );

                } catch (error) {

                    console.error(
                        "Payment verification error:",
                        error
                    );

                    setError(
                        error.message
                    );

                    setLoading(false);
                }
            },

            // ----------------------------------------------------
            // PAYMENT CLOSED
            // ----------------------------------------------------

            modal: {

                ondismiss: () => {

                    setLoading(false);

                    setError(
                        "Payment was cancelled."
                    );
                }

            }

        };

        // --------------------------------------------------------
        // CREATE RAZORPAY INSTANCE
        // --------------------------------------------------------

        const razorpay =
            new window.Razorpay(options);

        // --------------------------------------------------------
        // PAYMENT FAILED
        // --------------------------------------------------------

        razorpay.on(
            "payment.failed",
            (response) => {

                console.error(
                    "Razorpay payment failed:",
                    response.error
                );

                setError(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );

                setLoading(false);
            }
        );

        // --------------------------------------------------------
        // OPEN PAYMENT WINDOW
        // --------------------------------------------------------

        razorpay.open();
    };

    // ============================================================
    // PLACE ORDER
    // ============================================================

    const handlePlaceOrder = async (event) => {

        event.preventDefault();

        setError("");

        const token =
            localStorage.getItem("token");

        // --------------------------------------------------------
        // LOGIN CHECK
        // --------------------------------------------------------

        if (!token) {
            navigate("/login");
            return;
        }

        setLoading(true);

        try {

            // ====================================================
            // CREATE PAISAVASOOL ORDER
            // ====================================================

            const response =
                await fetch(
                    "http://localhost:5000/api/orders",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            shippingAddress,
                            paymentMethod
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to place order"
                );

            }

            const paisaVasoolOrder =
                data.order;

            // ====================================================
            // CASH ON DELIVERY
            // ====================================================

            if (paymentMethod === "cod") {

                navigate(
                    `/order-success/${paisaVasoolOrder._id}`
                );

                return;
            }

            // ====================================================
            // ONLINE PAYMENT
            // ====================================================

            await handleOnlinePayment(
                paisaVasoolOrder._id,
                token
            );

        } catch (error) {

            console.error(
                "Place order error:",
                error
            );

            setError(
                error.message
            );

            setLoading(false);
        }
    };

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="checkout-page">

            <h1>
                Checkout
            </h1>

            <form
                onSubmit={handlePlaceOrder}
            >

                {/* =================================================
                    SHIPPING ADDRESS
                ================================================= */}

                <section className="checkout-section">

                    <h2>
                        Shipping Address
                    </h2>

                    <div className="checkout-field">

                        <label>
                            Full Name
                        </label>

                        <input
                            type="text"
                            name="fullName"
                            value={
                                shippingAddress.fullName
                            }
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />

                    </div>

                    <div className="checkout-field">

                        <label>
                            Address
                        </label>

                        <textarea
                            name="address"
                            value={
                                shippingAddress.address
                            }
                            onChange={handleChange}
                            placeholder="Enter your address"
                            rows="4"
                            required
                        />

                    </div>

                    <div className="checkout-row">

                        <div className="checkout-field">

                            <label>
                                City
                            </label>

                            <input
                                type="text"
                                name="city"
                                value={
                                    shippingAddress.city
                                }
                                onChange={handleChange}
                                placeholder="City"
                                required
                            />

                        </div>

                        <div className="checkout-field">

                            <label>
                                State
                            </label>

                            <input
                                type="text"
                                name="state"
                                value={
                                    shippingAddress.state
                                }
                                onChange={handleChange}
                                placeholder="State"
                                required
                            />

                        </div>

                    </div>

                    <div className="checkout-row">

                        <div className="checkout-field">

                            <label>
                                Postal Code
                            </label>

                            <input
                                type="text"
                                name="postalCode"
                                value={
                                    shippingAddress.postalCode
                                }
                                onChange={handleChange}
                                placeholder="Postal Code"
                                required
                            />

                        </div>

                        <div className="checkout-field">

                            <label>
                                Country
                            </label>

                            <input
                                type="text"
                                name="country"
                                value={
                                    shippingAddress.country
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>

                </section>

                {/* =================================================
                    PAYMENT METHOD
                ================================================= */}

                <section className="checkout-section">

                    <h2>
                        Payment Method
                    </h2>

                    <label className="payment-option">

                        <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={
                                paymentMethod === "cod"
                            }
                            onChange={(event) =>
                                setPaymentMethod(
                                    event.target.value
                                )
                            }
                        />

                        Cash on Delivery

                    </label>

                    <label className="payment-option">

                        <input
                            type="radio"
                            name="paymentMethod"
                            value="online"
                            checked={
                                paymentMethod === "online"
                            }
                            onChange={(event) =>
                                setPaymentMethod(
                                    event.target.value
                                )
                            }
                        />

                        Online Payment

                    </label>

                </section>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="error-message">
                        {error}
                    </div>

                )}

                {/* =================================================
                    SUBMIT
                ================================================= */}

                <button
                    className="place-order-button"
                    type="submit"
                    disabled={loading}
                >

                    {loading

                        ? "Processing..."

                        : paymentMethod === "online"

                            ? "Proceed to Payment"

                            : "Place Order"

                    }

                </button>

            </form>

        </div>
    );
}

export default Checkout;