import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

function AdminDashboard() {

    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const currentYear = new Date().getFullYear();

    const [selectedYear, setSelectedYear] =
        useState(currentYear);


    // ============================================================
    // FETCH ALL ORDERS
    // ============================================================

    useEffect(() => {

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
                    "Admin dashboard error:",
                    error
                );

                setError(
                    error.message
                );


            } finally {

                setLoading(false);

            }

        };


        fetchOrders();

    }, [navigate]);


    // ============================================================
    // DASHBOARD STATISTICS
    // ============================================================

    const totalOrders =
        orders.length;


    // ============================================================
    // TOTAL REVENUE
    // ============================================================

    const totalRevenue =
        orders
            .filter((order) => {

                if (
                    order.status === "cancelled"
                ) {

                    return false;

                }


                if (
                    order.paymentMethod === "online"
                ) {

                    return (
                        order.paymentStatus === "paid"
                    );

                }


                return (
                    order.paymentMethod === "cod"
                );

            })
            .reduce(
                (total, order) => {

                    return (
                        total +
                        Number(
                            order.totalAmount || 0
                        )
                    );

                },
                0
            );


    // ============================================================
    // ORDER STATUS COUNTS
    // ============================================================

    const pendingOrders =
        orders.filter(
            (order) =>
                order.status === "pending"
        ).length;


    const confirmedOrders =
        orders.filter(
            (order) =>
                order.status === "confirmed"
        ).length;


    const shippedOrders =
        orders.filter(
            (order) =>
                order.status === "shipped"
        ).length;


    const deliveredOrders =
        orders.filter(
            (order) =>
                order.status === "delivered"
        ).length;


    const cancelledOrders =
        orders.filter(
            (order) =>
                order.status === "cancelled"
        ).length;


    // ============================================================
    // AVAILABLE YEARS
    // ============================================================

    const orderYears = orders
        .filter((order) => order.createdAt)
        .map((order) =>
            new Date(order.createdAt).getFullYear()
        );


    const firstOrderYear =
        orderYears.length > 0
            ? Math.min(...orderYears)
            : currentYear;


    /*
        Keep future years available so the admin can
        navigate through 2026, 2027, 2028, etc.

        These years will initially show zero values
        until orders exist for that year.
    */

    const lastAnalyticsYear =
        Math.max(
            currentYear + 5,
            orderYears.length > 0
                ? Math.max(...orderYears)
                : currentYear
        );


    const availableYears = [];


    for (
        let year = firstOrderYear;
        year <= lastAnalyticsYear;
        year++
    ) {

        availableYears.push(year);

    }


    // ============================================================
    // YEARLY MONTHLY ANALYTICS
    // ============================================================

    const monthlyData = {};


    /*
        Always create January to December.

        Even if there are no orders in a particular month,
        that month will still appear on the graph with 0.
    */

    for (let month = 0; month < 12; month++) {

        const monthName =
            new Date(
                selectedYear,
                month,
                1
            ).toLocaleString(
                "en-US",
                {
                    month: "short"
                }
            );


        const key =
            `${selectedYear}-${String(
                month + 1
            ).padStart(2, "0")}`;


        monthlyData[key] = {

            key,

            month:
                `${monthName} ${selectedYear}`,

            orders: 0,

            revenue: 0

        };

    }


    // ============================================================
    // ADD REAL ORDER DATA TO SELECTED YEAR
    // ============================================================

    orders.forEach((order) => {

        if (!order.createdAt) {

            return;

        }


        /*
            Cancelled orders should not contribute
            to analytics.
        */

        if (
            order.status === "cancelled"
        ) {

            return;

        }


        const date =
            new Date(order.createdAt);


        const year =
            date.getFullYear();


        /*
            Only process orders belonging to
            the currently selected year.
        */

        if (
            year !== selectedYear
        ) {

            return;

        }


        const month =
            date.getMonth();


        const key =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}`;


        if (!monthlyData[key]) {

            return;

        }


        // --------------------------------------------------------
        // COUNT ORDER
        // --------------------------------------------------------

        monthlyData[key].orders += 1;


        // --------------------------------------------------------
        // CALCULATE REVENUE
        // --------------------------------------------------------

        let contributesToRevenue =
            false;


        if (
            order.paymentMethod === "online"
        ) {

            contributesToRevenue =
                order.paymentStatus === "paid";

        } else if (
            order.paymentMethod === "cod"
        ) {

            contributesToRevenue =
                true;

        }


        if (contributesToRevenue) {

            monthlyData[key].revenue +=
                Number(
                    order.totalAmount || 0
                );

        }

    });


    // ============================================================
    // FINAL CHART DATA
    // ============================================================

    const chartData =
        Object.values(
            monthlyData
        );


    // ============================================================
    // CHANGE YEAR
    // ============================================================

    const handleYearChange = (event) => {

        setSelectedYear(
            Number(event.target.value)
        );

    };


    // ============================================================
    // PREVIOUS YEAR
    // ============================================================

    const handlePreviousYear = () => {

        setSelectedYear(
            (previousYear) =>
                Math.max(
                    firstOrderYear,
                    previousYear - 1
                )
        );

    };


    // ============================================================
    // NEXT YEAR
    // ============================================================

    const handleNextYear = () => {

        setSelectedYear(
            (previousYear) =>
                Math.min(
                    lastAnalyticsYear,
                    previousYear + 1
                )
        );

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="admin-page">

                <div className="admin-loading">

                    <div className="admin-loading-line"></div>

                    <h2>
                        Loading Dashboard
                    </h2>

                    <p>
                        Please wait...
                    </p>

                </div>

            </div>

        );

    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (

            <div className="admin-page">

                <div className="admin-error">

                    <span>
                        ADMIN PANEL
                    </span>

                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        {error}
                    </p>

                    <Link
                        to="/"
                        className="admin-dark-button"
                    >
                        BACK TO HOME
                    </Link>

                </div>

            </div>

        );

    }


    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="admin-page">


            {/* ==================================================
                ADMIN HEADER
            ================================================== */}

            <header className="admin-header">

                <div>

                    <span className="admin-eyebrow">
                        PAISAVASOOL
                    </span>

                    <h1>
                        ADMIN DASHBOARD
                    </h1>

                </div>


                <Link
                    to="/"
                    className="admin-view-store"
                >
                    VIEW STORE →
                </Link>

            </header>


            {/* ==================================================
                ADMIN NAVIGATION
            ================================================== */}

            <nav className="admin-navigation">

                <Link
                    to="/admin"
                    className="active"
                >
                    Dashboard
                </Link>

                <Link to="/admin/orders">
                    Orders
                </Link>

                <Link to="/admin/products">
                    Products
                </Link>

                <Link to="/admin/categories">
                    Categories
                </Link>

                <Link to="/admin/customers">
                    Customers
                </Link>

                <Link to="/admin/returns">
                    Returns & Refunds
                </Link>

            </nav>


            {/* ==================================================
                OVERVIEW
            ================================================== */}

            <section className="admin-section">

                <div className="admin-section-heading">

                    <div>

                        <span>
                            OVERVIEW
                        </span>

                        <h2>
                            Store Performance
                        </h2>

                    </div>

                </div>


                <div className="admin-stat-grid">


                    {/* TOTAL ORDERS */}

                    <div className="admin-stat-card">

                        <span>
                            TOTAL ORDERS
                        </span>

                        <strong>
                            {totalOrders}
                        </strong>

                        <small>
                            All orders
                        </small>

                    </div>


                    {/* TOTAL REVENUE */}

                    <div className="admin-stat-card admin-stat-highlight">

                        <span>
                            TOTAL REVENUE
                        </span>

                        <strong>
                            ₹
                            {totalRevenue.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                        <small>
                            Confirmed revenue
                        </small>

                    </div>


                    {/* PENDING */}

                    <div className="admin-stat-card">

                        <span>
                            PENDING ORDERS
                        </span>

                        <strong>
                            {pendingOrders}
                        </strong>

                        <small>
                            Awaiting confirmation
                        </small>

                    </div>


                    {/* DELIVERED */}

                    <div className="admin-stat-card">

                        <span>
                            DELIVERED
                        </span>

                        <strong>
                            {deliveredOrders}
                        </strong>

                        <small>
                            Successfully delivered
                        </small>

                    </div>

                </div>

            </section>


            {/* ==================================================
                ORDER STATUS
            ================================================== */}

            <section className="admin-section">

                <div className="admin-section-heading">

                    <div>

                        <span>
                            ORDER STATUS
                        </span>

                        <h2>
                            Order Overview
                        </h2>

                    </div>

                </div>


                <div className="admin-status-grid">

                    <div className="admin-status-card">

                        <span>
                            PENDING
                        </span>

                        <strong>
                            {pendingOrders}
                        </strong>

                    </div>


                    <div className="admin-status-card">

                        <span>
                            CONFIRMED
                        </span>

                        <strong>
                            {confirmedOrders}
                        </strong>

                    </div>


                    <div className="admin-status-card">

                        <span>
                            SHIPPED
                        </span>

                        <strong>
                            {shippedOrders}
                        </strong>

                    </div>


                    <div className="admin-status-card">

                        <span>
                            DELIVERED
                        </span>

                        <strong>
                            {deliveredOrders}
                        </strong>

                    </div>


                    <div className="admin-status-card admin-status-cancelled">

                        <span>
                            CANCELLED
                        </span>

                        <strong>
                            {cancelledOrders}
                        </strong>

                    </div>

                </div>

            </section>


            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="admin-section">

                <div className="admin-section-heading">

                    <div>

                        <span>
                            MANAGEMENT
                        </span>

                        <h2>
                            Quick Actions
                        </h2>

                    </div>

                </div>


                <div className="admin-actions-grid">


                    <Link
                        to="/admin/orders"
                        className="admin-action-card"
                    >

                        <span>
                            -
                        </span>

                        <div>

                            <h3>
                                Manage Orders
                            </h3>

                            <p>
                                View and manage customer orders.
                            </p>

                        </div>

                        <strong>
                            →
                        </strong>

                    </Link>


                    <Link
                        to="/admin/products"
                        className="admin-action-card"
                    >

                        <span>
                            -
                        </span>

                        <div>

                            <h3>
                                Manage Products
                            </h3>

                            <p>
                                Add, edit and manage products.
                            </p>

                        </div>

                        <strong>
                            →
                        </strong>

                    </Link>


                    <Link
                        to="/admin/categories"
                        className="admin-action-card"
                    >

                        <span>
                            -
                        </span>

                        <div>

                            <h3>
                                Manage Categories
                            </h3>

                            <p>
                                Organize your product categories.
                            </p>

                        </div>

                        <strong>
                            →
                        </strong>

                    </Link>


                    <Link
                        to="/admin/customers"
                        className="admin-action-card"
                    >

                        <span>
                            -
                        </span>

                        <div>

                            <h3>
                                Manage Customers
                            </h3>

                            <p>
                                View registered customers.
                            </p>

                        </div>

                        <strong>
                            →
                        </strong>

                    </Link>


                    <Link
                        to="/admin/returns"
                        className="admin-action-card"
                    >

                        <span>
                            -
                        </span>

                        <div>

                            <h3>
                                Returns & Refunds
                            </h3>

                            <p>
                                Manage customer returns and refunds.
                            </p>

                        </div>

                        <strong>
                            →
                        </strong>

                    </Link>

                </div>

            </section>


            {/* ==================================================
                ANALYTICS
            ================================================== */}

            <section className="admin-section">

                <div className="admin-section-heading">

                    <div>

                        <span>
                            ANALYTICS
                        </span>

                        <h2>
                            Revenue & Orders
                        </h2>

                    </div>

                </div>


                {/* ==================================================
                    CHART
                ================================================== */}

                <div className="admin-chart-card">

                    <div className="admin-chart">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >

                            <ComposedChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 20
                                }}
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e5e5"
                                />


                                <XAxis
                                    dataKey="month"
                                    tick={{
                                        fontSize: 11
                                    }}
                                    stroke="#888"
                                />


                                <YAxis
                                    yAxisId="orders"
                                    orientation="left"
                                    allowDecimals={false}
                                    domain={[
                                        0,
                                        "auto"
                                    ]}
                                    stroke="#888"
                                />


                                <YAxis
                                    yAxisId="revenue"
                                    orientation="right"
                                    domain={[
                                        0,
                                        "auto"
                                    ]}
                                    tickFormatter={(value) =>
                                        `₹${Number(
                                            value
                                        ).toLocaleString(
                                            "en-IN"
                                        )}`
                                    }
                                    stroke="#888"
                                />


                                <Tooltip
                                    formatter={(
                                        value,
                                        name
                                    ) => {

                                        if (
                                            name ===
                                            "Revenue"
                                        ) {

                                            return [
                                                `₹${Number(
                                                    value
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}`,
                                                "Revenue"
                                            ];

                                        }


                                        return [
                                            value,
                                            "Number of Orders"
                                        ];

                                    }}
                                />


                                <Legend />


                                <Bar
                                    yAxisId="orders"
                                    dataKey="orders"
                                    name="Number of Orders"
                                    fill="#ff6b1a"
                                    barSize={24}
                                    radius={[
                                        3,
                                        3,
                                        0,
                                        0
                                    ]}
                                />


                                <Line
                                    yAxisId="revenue"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="#111"
                                    strokeWidth={3}
                                    dot={{
                                        r: 4,
                                        fill: "#111"
                                    }}
                                    activeDot={{
                                        r: 6
                                    }}
                                    connectNulls
                                />

                            </ComposedChart>

                        </ResponsiveContainer>

                    </div>


                    {/* ==================================================
                        YEAR NAVIGATION
                    ================================================== */}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "25px",
                            marginTop: "20px",
                            paddingBottom: "5px"
                        }}
                    >

                        {/* PREVIOUS YEAR */}

                        <button
                            type="button"
                            onClick={handlePreviousYear}
                            disabled={
                                selectedYear <=
                                firstOrderYear
                            }
                            style={{
                                padding: "8px 16px",
                                cursor:
                                    selectedYear <= firstOrderYear
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            ← Back
                        </button>


                        {/* CURRENT YEAR */}

                        <strong
                            style={{
                                fontSize: "18px",
                                minWidth: "70px",
                                textAlign: "center"
                            }}
                        >
                            {selectedYear}
                        </strong>


                        {/* NEXT YEAR */}

                        <button
                            type="button"
                            onClick={handleNextYear}
                            disabled={
                                selectedYear >=
                                lastAnalyticsYear
                            }
                            style={{
                                padding: "8px 16px",
                                cursor:
                                    selectedYear >= lastAnalyticsYear
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            Next →
                        </button>

                    </div>

                </div>


                {/* ==================================================
                    ANALYTICS NOTE
                ================================================== */}

                <div className="admin-analytics-note">

                    <p>

                        <strong>
                            {selectedYear} Revenue:
                        </strong>{" "}

                        Cancelled orders are excluded.
                        Online orders are counted only
                        after payment confirmation.
                        COD orders are counted unless
                        cancelled.

                    </p>

                </div>

            </section>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <footer className="admin-footer">

                <strong>
                    PAISAVASOOL
                </strong>

                <span>
                    ADMIN PANEL · © 2026
                </span>

            </footer>


        </div>

    );

}

export default AdminDashboard;