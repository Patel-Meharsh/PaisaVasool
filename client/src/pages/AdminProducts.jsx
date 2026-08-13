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

    const [editingProductId, setEditingProductId] =
        useState(null);

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

                name:
                    form.name,

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
                    "Product created successfully."
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
                    "Product updated successfully."
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
                "Product deleted successfully."
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

            <div className="admin-products-page">

                <div className="admin-products-loading">

                    <h2>
                        Loading products...
                    </h2>

                </div>

            </div>

        );

    }


    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="admin-products-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="admin-products-header">

                <Link
                    to="/admin"
                    className="admin-back-link"
                >
                    ← Back to Dashboard
                </Link>


                <h1>
                    Manage Products
                </h1>


                <p>
                    Add, update and remove PaisaVasool products.
                </p>

            </div>


            {/* ==================================================
                MESSAGES
            ================================================== */}

            {error && (

                <div className="admin-products-error">

                    {error}

                </div>

            )}


            {success && (

                <div className="admin-products-success">

                    {success}

                </div>

            )}


            {/* ==================================================
                PRODUCT FORM
            ================================================== */}

            <div className="admin-product-form-card">

                <div className="admin-form-header">

                    <div>

                        <h2>
                            {editingProductId
                                ? "Edit Product"
                                : "Add New Product"}
                        </h2>

                        <p>
                            {editingProductId
                                ? "Update the product information below."
                                : "Enter the details for the new product."}
                        </p>

                    </div>

                </div>


                <form
                    onSubmit={handleSubmit}
                    className="admin-product-form"
                >

                    {/* NAME */}

                    <div className="product-form-group">

                        <label>
                            Product Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter product name"
                            required
                        />

                    </div>


                    {/* BRAND */}

                    <div className="product-form-group">

                        <label>
                            Brand
                        </label>

                        <input
                            type="text"
                            name="brand"
                            value={form.brand}
                            onChange={handleChange}
                            placeholder="Enter brand name"
                        />

                    </div>


                    {/* PRICE */}

                    <div className="product-form-group">

                        <label>
                            Price
                        </label>

                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            min="0"
                            placeholder="Enter price"
                            required
                        />

                    </div>


                    {/* STOCK */}

                    <div className="product-form-group">

                        <label>
                            Stock
                        </label>

                        <input
                            type="number"
                            name="stock"
                            value={form.stock}
                            onChange={handleChange}
                            min="0"
                            placeholder="Enter stock quantity"
                            required
                        />

                    </div>


                    {/* CATEGORY */}

                    <div className="product-form-group">

                        <label>
                            Category
                        </label>

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
                                        key={category._id}
                                        value={category._id}
                                    >
                                        {category.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* IMAGE URL */}

                    <div className="product-form-group">

                        <label>
                            Image URL
                        </label>

                        <input
                            type="text"
                            name="images"
                            value={form.images}
                            onChange={handleChange}
                            placeholder="https://..."
                        />

                    </div>


                    {/* DESCRIPTION */}

                    <div className="product-form-group product-form-full">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Enter product description"
                            rows="5"
                            required
                        />

                    </div>


                    {/* BUTTONS */}

                    <div className="product-form-actions">

                        <button
                            type="submit"
                            className="product-save-button"
                        >
                            {editingProductId
                                ? "Update Product"
                                : "Add Product"}
                        </button>


                        {editingProductId && (

                            <button
                                type="button"
                                className="product-cancel-button"
                                onClick={resetForm}
                            >
                                Cancel Edit
                            </button>

                        )}

                    </div>

                </form>

            </div>


            {/* ==================================================
                PRODUCT LIST
            ================================================== */}

            <div className="admin-products-list-section">

                <div className="admin-products-list-header">

                    <div>

                        <h2>
                            Products
                        </h2>

                        <p>
                            {products.length} product
                            {products.length !== 1
                                ? "s"
                                : ""}
                        </p>

                    </div>

                </div>


                {products.length === 0 ? (

                    <div className="admin-products-empty">

                        <h3>
                            No products found.
                        </h3>

                        <p>
                            Add your first product using
                            the form above.
                        </p>

                    </div>

                ) : (

                    <div className="admin-products-grid">

                        {products.map(
                            (product) => (

                                <div
                                    className="admin-product-card"
                                    key={product._id}
                                >

                                    {/* IMAGE */}

                                    <div className="admin-product-image">

                                        {product.images?.[0] ? (

                                            <img
                                                src={
                                                    product.images[0]
                                                }
                                                alt={
                                                    product.name
                                                }
                                            />

                                        ) : (

                                            <div className="no-product-image">
                                                No Image
                                            </div>

                                        )}

                                    </div>


                                    {/* PRODUCT CONTENT */}

                                    <div className="admin-product-content">

                                        <div className="admin-product-top">

                                            <div>

                                                <h3>
                                                    {product.name}
                                                </h3>

                                                <p className="product-brand">
                                                    {product.brand ||
                                                        "No brand"}
                                                </p>

                                            </div>


                                            <span
                                                className={
                                                    product.stock > 0
                                                        ? "product-stock-badge in-stock"
                                                        : "product-stock-badge out-of-stock"
                                                }
                                            >
                                                {product.stock > 0
                                                    ? "In Stock"
                                                    : "Out of Stock"}
                                            </span>

                                        </div>


                                        {/* CATEGORY */}

                                        <p className="product-category">

                                            {product.category?.name ||
                                                "No category"}

                                        </p>


                                        {/* DESCRIPTION */}

                                        <p className="product-description">

                                            {product.description ||
                                                "No description available."}

                                        </p>


                                        {/* PRICE + STOCK */}

                                        <div className="product-meta">

                                            <div>

                                                <span>
                                                    PRICE
                                                </span>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        product.price
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    STOCK
                                                </span>

                                                <strong>
                                                    {product.stock}
                                                </strong>

                                            </div>

                                        </div>


                                        {/* ACTIONS */}

                                        <div className="product-card-actions">

                                            <button
                                                type="button"
                                                className="product-edit-button"
                                                onClick={() =>
                                                    handleEdit(
                                                        product
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>


                                            <button
                                                type="button"
                                                className="product-delete-button"
                                                onClick={() =>
                                                    handleDelete(
                                                        product._id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>

    );

}

export default AdminProducts;