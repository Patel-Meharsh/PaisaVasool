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
    // ============================================================
    // FETCH ALL ORDERS
    // ============================================================
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token =
                    localStorage.getItem("token");
                // ------------------------------------------------
                // User must be logged in
                // ------------------------------------------------
                if (!token) {
                    navigate("/login");
                    return;
                }
                // ------------------------------------------------
                // Fetch all admin orders
                // ------------------------------------------------
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
                // ------------------------------------------------
                // Handle error
                // ------------------------------------------------
                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to fetch orders"
                    );
                }
                // ------------------------------------------------
                // Save orders
                // ------------------------------------------------
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
    // Cancelled orders are excluded.
    // Online orders:
    // Count only when paymentStatus = paid.
    // COD orders:
    // Count unless cancelled.
    // ============================================================
    const totalRevenue =
        orders
            .filter((order) => {
                // Cancelled orders do not generate revenue.
                if (
                    order.status === "cancelled"
                ) {
                    return false;
                }
                // Online payment
                if (
                    order.paymentMethod === "online"
                ) {
                    return (
                        order.paymentStatus === "paid"
                    );
                }
                // COD payment
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
    // MONTHLY ANALYTICS DATA
    // ============================================================
    const monthlyData = {};
    // ============================================================
    // CREATE LAST 12 MONTHS
    // ============================================================
    // This is important.
    // Even if there are no orders in a month,
    // that month will still appear on the chart.
    // Example:
    // Jan 2026 -> 0
    // Feb 2026 -> 0
    // Mar 2026 -> 4
    // Apr 2026 -> 2
    // This makes the revenue line visible over time.
    // ============================================================
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth() - i,
            1
        );
        const year =
            date.getFullYear();
        const month =
            date.getMonth();
        const monthName =
            date.toLocaleString(
                "en-US",
                {
                    month: "short"
                }
            );
        const key =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}`;
        monthlyData[key] = {
            key,
            month:
                `${monthName} ${year}`,
            orders: 0,
            revenue: 0
        };
    }
    // ============================================================
    // ADD REAL ORDER DATA
    // ============================================================
    orders.forEach((order) => {
        // --------------------------------------------------------
        // Ignore orders without creation date
        // --------------------------------------------------------
        if (!order.createdAt) {
             return;
        }
        // --------------------------------------------------------
        // Cancelled orders are excluded
        // --------------------------------------------------------
        if (
            order.status === "cancelled"
        ) {
            return;
        }
        // --------------------------------------------------------
        // Determine whether order contributes to revenue
        // --------------------------------------------------------
        let contributesToRevenue = false;
        // Online payment
        if (
            order.paymentMethod === "online"
        ) {
            contributesToRevenue =
                order.paymentStatus === "paid";
        }
        // COD payment
        else if (
            order.paymentMethod === "cod"
        ) {
            contributesToRevenue = true;

        }
        // --------------------------------------------------------
        // Get order date
        // --------------------------------------------------------
        const date =
            new Date(order.createdAt);
        const year =
            date.getFullYear();
        const month =
            date.getMonth();
        // --------------------------------------------------------
        // Create month key
        // --------------------------------------------------------
        const key =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}`;
        // --------------------------------------------------------
        // Ignore orders outside the last 12 months
        // --------------------------------------------------------
        if (!monthlyData[key]) {

            return;
        }
        // --------------------------------------------------------
        // Count order
        // --------------------------------------------------------
        monthlyData[key].orders += 1;
        // --------------------------------------------------------
        // Add revenue
        // --------------------------------------------------------
        if (
            contributesToRevenue
        ) {
            monthlyData[key].revenue +=
                Number(
                    order.totalAmount || 0
                );
        }
    });
    // ============================================================
    // CONVERT OBJECT INTO ARRAY
    // ============================================================
    const chartData =
        Object.values(
            monthlyData
        );
    // ============================================================
    // LOADING
    // ============================================================
    if (loading) {
        return (
            <div
                style={{
                    padding: "30px"
                }}
            >
                <h2>
                    Loading admin dashboard...
                </h2>
            </div>
        );
    }
    // ============================================================
    // ERROR
    // ============================================================
    if (error) {
        return (
            <div
                style={{
                    padding: "30px"
                }}
            >
                <h2>
                    Admin Dashboard
                </h2>
                <p>
                    {error}
                </p>
                <Link to="/">
                    Back to Home
                </Link>

            </div>

        );
    }
    // ============================================================
    // UI
    // ============================================================
    return (
        <div
            style={{
                padding: "30px",
                fontFamily: "Arial, sans-serif"
            }}
        >
            {/* ==================================================
                HEADER
            ================================================== */}
            <h1>
                Admin Dashboard
            </h1>
            <p>
                Welcome to the PaisaVasool Admin Panel
            </p>
            {/* ==================================================
                DASHBOARD NAVIGATION
            ================================================== */}
            <nav
                style={{
                    marginTop: "20px",
                    marginBottom: "20px"
                }}
            >
                <Link to="/admin">
                    Dashboard
                </Link>
                {" | "}
                <Link to="/admin/orders">
                    Orders
                </Link>
                {" | "}
                <Link to="/admin/products">
                    Products
                </Link>
                {" | "}
                <Link to="/admin/categories">
                    Categories
                </Link>
                {" | "}
                <Link to="/admin/customers">
                    Customers
                </Link>
                {" | "}
                <Link to="/admin/returns">
                    Returns & Refunds
                </Link>
            </nav>
            <hr />
            {/* ==================================================
                OVERVIEW
            ================================================== */}
            <h2>
                Overview
            </h2>
            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    marginBottom: "30px"
                }}
            >
                {/* TOTAL ORDERS */}
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "20px",
                        minWidth: "180px"
                    }}
                >
                    <h3>
                        Total Orders
                    </h3>
                    <p
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold"
                        }}
                    >
                        {totalOrders}
                    </p>
                </div>
                {/* TOTAL REVENUE */}
                 <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "20px",
                        minWidth: "180px"
                    }}
                >
                    <h3>
                        Total Revenue
                    </h3>
                    <p
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold"
                        }}
                    >
                        ₹
                        {totalRevenue.toLocaleString(
                            "en-IN"
                        )}
                    </p>
                </div>
                {/* PENDING */}
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "20px",
                        minWidth: "180px"
                    }}
                >
                    <h3>
                        Pending Orders
                    </h3>
                    <p
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold"
                        }}
                    >
                        {pendingOrders}
                    </p>
                </div>
                {/* DELIVERED */}
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "20px",
                        minWidth: "180px"
                    }}
                >
                    <h3>
                        Delivered Orders
                    </h3>
                    <p
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold"
                        }}
                    >
                        {deliveredOrders}
                    </p>
                </div>
            </div>
            <hr />
            {/* ==================================================
                ORDER STATUS
            ================================================== */}
            <h2>
                Order Status
            </h2>
            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    marginBottom: "30px"
                }}
            >
                {/* PENDING */}
                <div>
                    <h3>
                        Pending
                    </h3>
                    <p>
                        {pendingOrders}
                    </p>
                </div>
                {/* CONFIRMED */}

                <div>
                    <h3>
                        Confirmed
                    </h3>
                    <p>
                        {confirmedOrders}
                    </p>
                </div>
                {/* SHIPPED */}
                <div>
                    <h3>
                        Shipped
                    </h3>
                    <p>
                        {shippedOrders}
                    </p>
                </div>
                {/* DELIVERED */}
                <div>
                    <h3>
                        Delivered
                    </h3>
                    <p>
                        {deliveredOrders}
                    </p>
                </div>
                {/* CANCELLED */}
                <div>
                    <h3>
                        Cancelled
                    </h3>
                    <p>
                        {cancelledOrders}
                    </p>
                </div>
            </div>
            <hr />
            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}
            <h2>
                Quick Actions
            </h2>
            <div>
                <p>
                    <Link to="/admin/orders">
                        Manage Orders
                    </Link>
                </p>
                <p>
                    <Link to="/admin/products">
                        Manage Products
                    </Link>
                </p>
                <p>
                    <Link to="/admin/categories">
                        Manage Categories
                    </Link>
                </p>
                <p>
                    <Link to="/admin/customers">
                        Manage Customers
                    </Link>
                </p>
                <p>
                    <Link to="/admin/returns">
                        Manage Returns & Refunds
                    </Link>
                </p>
            </div>
            <hr />
            {/* ==================================================
                ANALYTICS
            ================================================== */}
            <h2>
                Analytics
            </h2>
            {/* ==================================================
                REVENUE + ORDERS CHART
            ================================================== */}
            <div
                style={{
                    marginTop: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "20px",
                    backgroundColor: "#fff"
                }}
            >
                <h3>
                    Revenue & Orders
                </h3>
                <p>
                    Monthly revenue and order count
                </p>
                {chartData.length === 0 ? (
                    <p>
                        No sales data available yet.
                    </p>
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "500px"
                        }}
                    >
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <ComposedChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 70,
                                    left: 50,
                                    bottom: 40
                                }}
                            >
                                {/* ==================================================
                                    GRID
                                ================================================== */}
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#d9d9d9"
                                />
                                {/* ==================================================
                                    X AXIS
                                ================================================== */}
                                <XAxis
                                    dataKey="month"
                                    tick={{
                                        fontSize: 12
                                    }}
                                />
                                {/* ==================================================
                                    LEFT Y AXIS
                                    NUMBER OF ORDERS
                                ================================================== */}
                                <YAxis
                                    yAxisId="orders"
                                    orientation="left"
                                    allowDecimals={false}
                                    domain={[
                                        0,
                                        "auto"
                                    ]}
                                    label={{
                                        value:
                                            "Number of Orders",
                                        angle: -90,
                                        position:
                                            "insideLeft"
                                    }}
                                />
                                {/* ==================================================
                                    RIGHT Y AXIS
                                    REVENUE
                                ================================================== */}
                                <YAxis
                                    yAxisId="revenue"
                                    orientation="right"
                                    domain={[
                                        0,
                                        "auto"
                                    ]}
                                    tickFormatter={(
                                        value
                                    ) =>
                                        `₹${Number(
                                            value
                                        ).toLocaleString(
                                            "en-IN"
                                        )}`
                                    }
                                    label={{
                                        value:
                                            "Revenue (₹)",
                                        angle: 90,
                                        position:
                                            "insideRight"
                                    }}
                                />
                                {/* ==================================================
                                    TOOLTIP
                                ================================================== */}
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
                                {/* ==================================================
                                    LEGEND
                                ================================================== */}
                                <Legend />
                                {/* ==================================================
                                    ORANGE BAR
                                    NUMBER OF ORDERS
                                ================================================== */}
                                <Bar
                                    yAxisId="orders"
                                    dataKey="orders"
                                    name="Number of Orders"
                                    fill="#f39c12"
                                    barSize={28}
                                    radius={[
                                        4,
                                        4,
                                        0,
                                        0
                                    ]}
                                />
                                {/* ==================================================
                                    BLUE LINE
                                    REVENUE
                                ================================================== */}
                                <Line
                                    yAxisId="revenue"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="#1976d2"
                                    strokeWidth={3}
                                    dot={{
                                        r: 5,
                                        fill: "#1976d2"
                                    }}
                                    activeDot={{
                                        r: 7
                                    }}
                                    connectNulls={true}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            {/* ==================================================
                ANALYTICS INFORMATION
            ================================================== */}
            <div
                style={{
                    marginTop: "20px"
                }}
            >
                <h3>
                    Analytics Information
                </h3>
                <ul>
                    <li>
                        Orange bars represent the
                        number of orders.
                    </li>
                    <li>
                        Blue line represents revenue.
                    </li>
                    <li>
                        Left Y-axis represents
                        number of orders.
                    </li>
                    <li>
                        Right Y-axis represents
                        revenue in ₹.
                    </li>
                    <li>
                        X-axis represents month
                        and year.
                    </li>
                    <li>
                        Cancelled orders are excluded
                        from revenue.
                    </li>
                    <li>
                        Online revenue is counted
                        only for paid orders.
                    </li>
                    <li>
                        COD orders are counted unless
                        cancelled.
                    </li>
                    <li>
                        The chart displays the
                        last 12 months.
                    </li>
                </ul>
            </div>
        </div>
    );
}
export default AdminDashboard;