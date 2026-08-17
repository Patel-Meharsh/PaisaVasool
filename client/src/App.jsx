import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Register from "./pages/Register";
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


                {/* HOME */}

                <Route
                    path="/"
                    element={<Home />}
                />


                {/* PRODUCTS */}

                <Route
                    path="/products"
                    element={<Products />}
                />


                {/* PRODUCT DETAILS */}

                <Route
                    path="/products/:id"
                    element={<ProductDetails />}
                />


                {/* REGISTER */}

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* LOGIN */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* CART */}

                <Route
                    path="/cart"
                    element={<Cart />}
                />


                {/* CHECKOUT */}

                <Route
                    path="/checkout"
                    element={<Checkout />}
                />


                {/* ORDER SUCCESS */}

                <Route
                    path="/order-success/:id"
                    element={<OrderSuccess />}
                />


                {/* MY ORDERS */}

                <Route
                    path="/orders"
                    element={<Orders />}
                />


                {/* ORDER DETAILS */}

                <Route
                    path="/orders/:id"
                    element={<OrderDetails />}
                />


                {/* PROFILE */}

                <Route
                    path="/profile"
                    element={<Profile />}
                />


                {/* PRICE ALERTS */}

                <Route
                    path="/price-alerts"
                    element={<PriceAlerts />}
                />


                {/* ==================================================
                    ADMIN PAGES
                ================================================== */}


                {/* ADMIN DASHBOARD */}

                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />


                {/* ADMIN ORDERS */}

                <Route
                    path="/admin/orders"
                    element={<AdminOrders />}
                />


                {/* ADMIN RETURNS */}

                <Route
                    path="/admin/returns"
                    element={<AdminReturns />}
                />


                {/* ADMIN PRODUCTS */}

                <Route
                    path="/admin/products"
                    element={<AdminProducts />}
                />


                {/* ADMIN CATEGORIES */}

                <Route
                    path="/admin/categories"
                    element={<AdminCategories />}
                />


                {/* ADMIN CUSTOMERS */}

                <Route
                    path="/admin/customers"
                    element={<AdminCustomers />}
                />


            </Routes>

        </BrowserRouter>

    );

}


export default App;