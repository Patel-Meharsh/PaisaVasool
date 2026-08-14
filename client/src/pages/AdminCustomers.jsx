import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminCustomer() {

    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [updatingCustomerId, setUpdatingCustomerId] =
        useState(null);


    // ============================================================
    // FETCH ALL CUSTOMERS
    // ============================================================

    const fetchCustomers = async () => {

        try {

            setLoading(true);

            setError("");

            const token =
                localStorage.getItem("token");


            // ----------------------------------------------------
            // CHECK LOGIN
            // ----------------------------------------------------

            if (!token) {

                navigate("/login");

                return;

            }


            // ----------------------------------------------------
            // FETCH CUSTOMERS
            // ----------------------------------------------------

            const response = await fetch(
                "http://localhost:5000/api/admin/customers",
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
            // HANDLE API ERROR
            // ----------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch customers"
                );

            }


            // ----------------------------------------------------
            // STORE CUSTOMERS
            // ----------------------------------------------------

            setCustomers(
                data.customers || []
            );


        } catch (error) {

            console.error(
                "Admin customers error:",
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
    // LOAD CUSTOMERS
    // ============================================================

    useEffect(() => {

        fetchCustomers();

    }, []);


    // ============================================================
    // UPDATE CUSTOMER STATUS
    // ============================================================

    const handleStatusChange = async (
        customerId,
        newStatus
    ) => {

        try {

            setUpdatingCustomerId(
                customerId
            );

            setError("");

            setSuccess("");


            const token =
                localStorage.getItem("token");


            // ----------------------------------------------------
            // CHECK LOGIN
            // ----------------------------------------------------

            if (!token) {

                navigate("/login");

                return;

            }


            // ----------------------------------------------------
            // UPDATE CUSTOMER STATUS
            // ----------------------------------------------------

            const response = await fetch(
                `http://localhost:5000/api/admin/customers/${customerId}/status`,
                {
                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        isActive:
                            newStatus

                    })

                }
            );


            const data =
                await response.json();


            // ----------------------------------------------------
            // HANDLE API ERROR
            // ----------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update customer status"
                );

            }


            // ----------------------------------------------------
            // UPDATE CUSTOMER IN UI
            // ----------------------------------------------------

            setCustomers(
                (previousCustomers) =>

                    previousCustomers.map(
                        (customer) =>

                            customer._id ===
                            customerId

                                ? {

                                    ...customer,

                                    isActive:
                                        data.customer
                                            ?.isActive ??
                                        newStatus

                                }

                                : customer

                    )

            );


            // ----------------------------------------------------
            // SUCCESS MESSAGE
            // ----------------------------------------------------

            setSuccess(
                newStatus
                    ? "Customer activated successfully."
                    : "Customer deactivated successfully."
            );


        } catch (error) {

            console.error(
                "Update customer status error:",
                error
            );

            setError(
                error.message
            );


        } finally {

            setUpdatingCustomerId(
                null
            );

        }

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="admin-page">

                <div className="admin-loading">

                    <h2>
                        Loading customers...
                    </h2>

                    <p>
                        Please wait while customer
                        accounts are being loaded.
                    </p>

                </div>

            </div>

        );

    }


    // ============================================================
    // UI
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
                        Customer Management
                    </h1>

                    <p>
                        Manage PaisaVasool customer
                        accounts and account status.
                    </p>

                </div>


                <div className="admin-page-count">

                    <strong>
                        {customers.length}
                    </strong>

                    <span>
                        Customers
                    </span>

                </div>

            </div>


            {/* ====================================================
                ERROR MESSAGE
            ==================================================== */}

            {error && (

                <div className="admin-error">

                    {error}

                </div>

            )}


            {/* ====================================================
                SUCCESS MESSAGE
            ==================================================== */}

            {success && (

                <div className="admin-success">

                    {success}

                </div>

            )}


            {/* ====================================================
                NO CUSTOMERS
            ==================================================== */}

            {customers.length === 0 ? (

                <div className="admin-empty-state">

                    <h2>
                        No customers found
                    </h2>

                    <p>
                        There are currently no customer
                        accounts to display.
                    </p>

                </div>

            ) : (

                <div className="admin-customer-list">

                    {customers.map(
                        (customer) => (

                            <div
                                className="admin-customer-card"
                                key={customer._id}
                            >


                                {/* ====================================
                                    CUSTOMER HEADER
                                ==================================== */}

                                <div className="customer-card-header">

                                    <div>

                                        <h2>
                                            {customer.name}
                                        </h2>

                                        <p className="customer-email">
                                            {customer.email}
                                        </p>

                                    </div>


                                    <span
                                        className={
                                            customer.isActive
                                                ? "status-badge active"
                                                : "status-badge inactive"
                                        }
                                    >

                                        {customer.isActive
                                            ? "Active"
                                            : "Inactive"}

                                    </span>

                                </div>


                                {/* ====================================
                                    CUSTOMER DETAILS
                                ==================================== */}

                                <div className="customer-details">


                                    {/* ROLE */}

                                    <div className="customer-detail">

                                        <span className="detail-label">
                                            Role
                                        </span>

                                        <strong>
                                            {customer.role || "Customer"}
                                        </strong>

                                    </div>


                                    {/* EMAIL VERIFICATION */}

                                    <div className="customer-detail">

                                        <span className="detail-label">
                                            Email Verification
                                        </span>

                                        <strong
                                            className={
                                                customer.isEmailVerified
                                                    ? "verified-text"
                                                    : "unverified-text"
                                            }
                                        >

                                            {customer.isEmailVerified
                                                ? "Verified"
                                                : "Not Verified"}

                                        </strong>

                                    </div>


                                    {/* REGISTRATION DATE */}

                                    <div className="customer-detail">

                                        <span className="detail-label">
                                            Registered On
                                        </span>

                                        <strong>

                                            {customer.createdAt

                                                ? new Date(
                                                    customer.createdAt
                                                ).toLocaleDateString(
                                                    "en-IN",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    }
                                                )

                                                : "Unknown"}

                                        </strong>

                                    </div>


                                    {/* CUSTOMER ID */}

                                    <div className="customer-detail customer-id">

                                        <span className="detail-label">
                                            Customer ID
                                        </span>

                                        <span>
                                            {customer._id}
                                        </span>

                                    </div>

                                </div>


                                {/* ====================================
                                    ACCOUNT STATUS
                                ==================================== */}

                                <div className="customer-status-section">

                                    <div>

                                        <span className="detail-label">
                                            Account Status
                                        </span>

                                        <p>

                                            This account is currently{" "}

                                            <strong>
                                                {customer.isActive
                                                    ? "active"
                                                    : "inactive"}
                                            </strong>

                                            .

                                        </p>

                                    </div>


                                    {/* =================================
                                        STATUS BUTTON
                                    ================================= */}

                                    <button

                                        className={
                                            customer.isActive
                                                ? "customer-action-btn deactivate"
                                                : "customer-action-btn activate"
                                        }

                                        disabled={
                                            updatingCustomerId ===
                                            customer._id
                                        }

                                        onClick={() =>
                                            handleStatusChange(

                                                customer._id,

                                                !customer.isActive

                                            )
                                        }

                                    >

                                        {updatingCustomerId ===
                                        customer._id

                                            ? "Updating..."

                                            : customer.isActive
                                                ? "Deactivate Customer"
                                                : "Activate Customer"}

                                    </button>

                                </div>


                            </div>

                        )
                    )}

                </div>

            )}

        </div>

    );

}


export default AdminCustomer;