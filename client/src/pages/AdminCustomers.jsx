import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminCustomer() {

    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [updatingCustomerId, setUpdatingCustomerId] =
        useState(null);


    // ============================================================
    // FETCH ALL CUSTOMERS
    // ============================================================

    const fetchCustomers = async () => {

        try {

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
            // Fetch customers
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
            // Handle error
            // ----------------------------------------------------

            if (!response.ok) {

                throw new Error(

                    data.message ||
                    "Failed to fetch customers"

                );

            }


            // ----------------------------------------------------
            // Save customers
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
            // Update customer status
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
            // Handle error
            // ----------------------------------------------------

            if (!response.ok) {

                throw new Error(

                    data.message ||
                    "Failed to update customer status"

                );

            }


            // ----------------------------------------------------
            // Update customer directly in UI
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

            <div>

                <h2>
                    Loading customers...
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
                Admin Customers
            </h1>


            <p>
                Manage PaisaVasool customer accounts.
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
                NO CUSTOMERS
            ================================================== */}

            {customers.length === 0 ? (

                <h2>
                    No customers found.
                </h2>

            ) : (

                <div>

                    {/* ==================================================
                        CUSTOMERS
                    ================================================== */}

                    {customers.map(
                        (customer) => (

                            <div
                                key={
                                    customer._id
                                }
                            >

                                <hr />


                                {/* ==========================================
                                    CUSTOMER INFORMATION
                                ========================================== */}

                                <h2>
                                    {customer.name}
                                </h2>


                                <p>
                                    Customer ID:{" "}

                                    {customer._id}
                                </p>


                                <p>
                                    Email:{" "}

                                    {customer.email}
                                </p>


                                {/* ==========================================
                                    ROLE
                                ========================================== */}

                                <p>
                                    Role:{" "}

                                    <strong>
                                        {customer.role}
                                    </strong>
                                </p>


                                {/* ==========================================
                                    EMAIL VERIFICATION
                                ========================================== */}

                                <p>
                                    Email Verified:{" "}

                                    <strong>

                                        {
                                            customer.isEmailVerified
                                                ? "Yes"
                                                : "No"
                                        }

                                    </strong>

                                </p>


                                {/* ==========================================
                                    REGISTRATION DATE
                                ========================================== */}

                                <p>
                                    Registered On:{" "}

                                    {customer.createdAt

                                        ? new Date(
                                            customer.createdAt
                                        ).toLocaleString()

                                        : "Unknown"

                                    }

                                </p>


                                {/* ==========================================
                                    ACCOUNT STATUS
                                ========================================== */}

                                <h3>
                                    Account Status
                                </h3>


                                <p>

                                    Current Status:{" "}

                                    <strong>

                                        {customer.isActive
                                            ? "Active"
                                            : "Inactive"}

                                    </strong>

                                </p>


                                {/* ==========================================
                                    STATUS BUTTON
                                ========================================== */}

                                <button

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
                                            : "Activate Customer"

                                    }

                                </button>


                                {updatingCustomerId ===
                                    customer._id && (

                                    <p>
                                        Updating customer
                                        status...
                                    </p>

                                )}

                            </div>

                        )

                    )}

                </div>

            )}


        </div>

    );
}
export default AdminCustomer;