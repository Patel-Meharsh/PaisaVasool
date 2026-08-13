import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminReturns from "./pages/AdminReturns";
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import AdminCustomers from "./pages/AdminCustomers";

import Profile from "./pages/Profile";
import PriceAlerts from "./pages/PriceAlerts";
import Recommendations from "./pages/Recommendations";

function App() {
    return (
        <BrowserRouter>

            <Navbar />

            <Routes>

                {/* ==================================================
                    CUSTOMER PAGES
                ================================================== */}

                {/* Home */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Products */}
                <Route
                    path="/products"
                    element={<Products />}
                />

                {/* Product Details */}
                <Route
                    path="/products/:id"
                    element={<ProductDetails />}
                />

                {/* Register */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Email Verification */}
                <Route
                    path="/verify-email"
                    element={<VerifyEmail />}
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Cart */}
                <Route
                    path="/cart"
                    element={<Cart />}
                />

                {/* Checkout */}
                <Route
                    path="/checkout"
                    element={<Checkout />}
                />

                {/* Order Success */}
                <Route
                    path="/order-success/:id"
                    element={<OrderSuccess />}
                />

                {/* My Orders */}
                <Route
                    path="/orders"
                    element={<Orders />}
                />

                {/* Order Details */}
                <Route
                    path="/orders/:id"
                    element={<OrderDetails />}
                />

                {/* Profile */}
                <Route
                    path="/profile"
                    element={<Profile />}
                />

                {/* Price Alerts */}
                <Route
                    path="/price-alerts"
                    element={<PriceAlerts />}
                />

                {/* Recommendations */}
                {/* Recommendations are displayed on the Home page.
                    No separate route is required. */}
                

                {/* ==================================================
                    ADMIN PAGES
                ================================================== */}

                {/* Admin Dashboard */}
                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                {/* Admin Orders */}
                <Route
                    path="/admin/orders"
                    element={<AdminOrders />}
                />

                {/* Admin Returns */}
                <Route
                    path="/admin/returns"
                    element={<AdminReturns />}
                />

                {/* Admin Products */}
                <Route
                    path="/admin/products"
                    element={<AdminProducts />}
                />

                {/* Admin Categories */}
                <Route
                    path="/admin/categories"
                    element={<AdminCategories />}
                />

                {/* Admin Customers */}
                <Route
                    path="/admin/customers"
                    element={<AdminCustomers />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;