import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";
import "./marketplace.css";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
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
                {/* CUSTOMER PAGES */}

                <Route path="/" element={<Home />} />

                {/* Category-first shopping */}
                <Route path="/shop" element={<Shop />} />

                {/* Product catalogue */}
                <Route path="/products" element={<Products />} />

                <Route
                    path="/products/:id"
                    element={<ProductDetails />}
                />

                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />

                <Route
                    path="/order-success/:id"
                    element={<OrderSuccess />}
                />

                <Route path="/orders" element={<Orders />} />

                <Route
                    path="/orders/:id"
                    element={<OrderDetails />}
                />

                <Route path="/profile" element={<Profile />} />

                <Route
                    path="/price-alerts"
                    element={<PriceAlerts />}
                />

                {/* ADMIN PAGES */}

                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/returns" element={<AdminReturns />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route
                    path="/admin/categories"
                    element={<AdminCategories />}
                />
                <Route
                    path="/admin/customers"
                    element={<AdminCustomers />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;