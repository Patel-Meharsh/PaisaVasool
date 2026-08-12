import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
function AdminProducts() {
    const navigate = useNavigate();
    // ============================================================
    // STATE
    // ============================================================
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingProductId, setEditingProductId] = useState(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        brand: "",
        category: "",
        images: ""
    });
    // ============================================================
    // FETCH PRODUCTS
    // ============================================================
    const fetchProducts = async () => {
        try {
            const token =
                localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            const response = await fetch(
                "http://localhost:5000/api/products"
            );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to fetch products"
                );
            }
            setProducts(
                data.products || []
            );
        } catch (error) {
            console.error(
                "Fetch products error:",
                error
            );
            setError(
                error.message
            );
        }
    };
    // ============================================================
    // FETCH CATEGORIES
    // ============================================================
    const fetchCategories = async () => {
        try {
            const token =
                localStorage.getItem("token");
            const response = await fetch(
                "http://localhost:5000/api/categories",
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
                    "Failed to fetch categories"
                );
            }
            setCategories(
                data.categories || []
            );
        } catch (error) {
            console.error(
                "Fetch categories error:",
                error
            );
        }
    };
    // ============================================================
    // LOAD DATA
    // ============================================================
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);
            setLoading(false);
        };
        loadData();
    }, []);
    // ============================================================
    // HANDLE INPUT
    // ============================================================
    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;
        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));
    };
    // ============================================================
    // RESET FORM
    // ============================================================
    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            price: "",
            stock: "",
            brand: "",
            category: "",
            images: ""
        });
        setEditingProductId(null);
    };
    // ============================================================
    // CREATE / UPDATE PRODUCT
    // ============================================================
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        try {
            const token =
                localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            const productData = {
                name: form.name,
                description:
                    form.description,
                price:
                    Number(form.price),
                stock:
                    Number(form.stock),
                brand:
                    form.brand,
                category:
                    form.category,
                images:
                    form.images
                        ? [form.images]
                        : []
            };
            // ----------------------------------------------------
            // CREATE
            // ----------------------------------------------------
            if (!editingProductId) {
                const response = await fetch(
                    "http://localhost:5000/api/products",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`
                        },
                        body:
                            JSON.stringify(
                                productData
                            )
                    }
                );
                const data =
                    await response.json();
                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to create product"
                    );
                }
                setSuccess(
                    "Product created successfully"
                );
            }
            // ----------------------------------------------------
            // UPDATE
            // ----------------------------------------------------
            else {
                const response = await fetch(
                    `http://localhost:5000/api/products/${editingProductId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`
                        },
                        body:
                            JSON.stringify(
                                productData
                            )
                    }
                );
                const data =
                    await response.json();
                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to update product"
                    );
                }
                setSuccess(
                    "Product updated successfully"
                );
            }
            resetForm();
            await fetchProducts();
        } catch (error) {
            console.error(
                "Save product error:",
                error
            );
            setError(
                error.message
            );
        }
    };
    // ============================================================
    // EDIT PRODUCT
    // ============================================================
    const handleEdit = (product) => {
        setEditingProductId(
            product._id
        );
        setForm({
            name:
                product.name || "",
            description:
                product.description || "",
            price:
                product.price || "",
            stock:
                product.stock || "",
            brand:
                product.brand || "",
            category:
                product.category?._id ||
                product.category ||
                "",
            images:
                product.images?.[0] || ""
        });
        setError("");
        setSuccess("");
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    // ============================================================
    // DELETE PRODUCT
    // ============================================================
    const handleDelete = async (productId) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this product?"
            );
        if (!confirmed) {
            return;
        }
        try {
            setError("");
            setSuccess("");
            const token =
                localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5000/api/products/${productId}`,
                {
                    method: "DELETE",
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
                    "Failed to delete product"
                );
            }
            setSuccess(
                "Product deleted successfully"
            );
            await fetchProducts();
        } catch (error) {
            console.error(
                "Delete product error:",
                error
            );
            setError(
                error.message
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
                    Loading products...
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
                Manage Products
            </h1>
            <p>
                Add, update and remove PaisaVasool products.
            </p>
            {/* ==================================================
                MESSAGES
            ================================================== */}
            {error && (
                <p>
                    {error}
                </p>
            )}
            {success && (
                <p>
                    {success}
                </p>
            )}
            {/* ==================================================
                PRODUCT FORM
            ================================================== */}
            <hr />
            <h2>
                {editingProductId
                    ? "Edit Product"
                    : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit}>
                {/* Name */}
                <div>
                    <label>
                        Product Name
                    </label>
                    <br />
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <br />
                {/* Description */}
                <div>
                    <label>
                        Description
                    </label>
                    <br />
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        required
                    />
                </div>
                <br />
                {/* Price */}
                <div>
                    <label>
                        Price
                    </label>
                    <br />
                    <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </div>
                <br />
                {/* Stock */}
                <div>
                    <label>
                        Stock
                    </label>
                    <br />
                    <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        min="0"
                        required
                    />
                </div>
                <br />
                {/* Brand */}
                <div>
                    <label>
                        Brand
                    </label>
                    <br />
                    <input
                        type="text"
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                    />
                </div>
                <br />
                {/* Category */}
                <div>
                    <label>
                        Category
                    </label>
                    <br />
                    <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                            Select Category
                        </option>
                        {categories.map(
                            (category) => (
                                <option
                                    key={
                                        category._id
                                    }
                                    value={
                                        category._id
                                    }
                                >
                                    {
                                        category.name
                                    }
                                </option>
                            )
                        )}
                    </select>
                </div>
                <br />
                {/* Image URL */}
                <div>
                    <label>
                        Image URL
                    </label>
                    <br />
                    <input
                        type="text"
                        name="images"
                        value={form.images}
                        onChange={handleChange}
                        placeholder="https://..."
                    />
                </div>
                <br />
                {/* Buttons */}
                <button type="submit">
                    {editingProductId
                        ? "Update Product"
                        : "Add Product"}
                </button>
                {editingProductId && (
                    <button
                        type="button"
                        onClick={resetForm}
                    >
                        Cancel Edit
                    </button>
                )}
            </form>
            {/* ==================================================
                PRODUCT LIST
            ================================================== */}
            <hr />
            <h2>
                Products
            </h2>
            {products.length === 0 ? (
                <p>
                    No products found.
                </p>
            ) : (
                <div>
                    {products.map(
                        (product) => (
                            <div
                                key={
                                    product._id
                                }
                            >
                                <hr />
                                <h3>
                                    {
                                        product.name
                                    }
                                </h3>
                                <p>
                                    Brand:{" "}
                                    {
                                        product.brand ||
                                        "N/A"
                                    }
                                </p>
                                <p>
                                    Category:{" "}
                                    {
                                        product.category?.name ||
                                        "N/A"
                                    }
                                </p>
                                <p>
                                    Price: ₹
                                    {
                                        Number(
                                            product.price
                                        ).toLocaleString(
                                            "en-IN"
                                        )
                                    }
                                </p>
                                <p>
                                    Stock:{" "}
                                    {
                                        product.stock
                                    }
                                </p>
                                <p>
                                    Status:{" "}
                                    <strong>
                                        {
                                            product.stock > 0
                                                ? "In Stock"
                                                : "Out of Stock"
                                        }
                                    </strong>
                                </p>
                                <button
                                    onClick={() =>
                                        handleEdit(
                                            product
                                        )
                                    }
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() =>
                                        handleDelete(
                                            product._id
                                        )
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
export default AdminProducts;