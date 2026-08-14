import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminCategories() {

    const navigate = useNavigate();

    // ============================================================
    // STATE
    // ============================================================

    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [saving, setSaving] = useState(false);

    const [editingCategoryId, setEditingCategoryId] =
        useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });


    // ============================================================
    // FETCH CATEGORIES
    // ============================================================

    const fetchCategories = async () => {

        try {

            setLoading(true);

            setError("");

            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


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

            setError(
                error.message
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LOAD CATEGORIES
    // ============================================================

    useEffect(() => {

        fetchCategories();

    }, []);


    // ============================================================
    // HANDLE FORM INPUT
    // ============================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setFormData((previousData) => ({

            ...previousData,

            [name]: value

        }));

    };


    // ============================================================
    // RESET FORM
    // ============================================================

    const resetForm = () => {

        setFormData({
            name: "",
            description: ""
        });

        setEditingCategoryId(null);

    };


    // ============================================================
    // CREATE CATEGORY
    // ============================================================

    const handleCreateCategory = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        if (!formData.name.trim()) {

            setError(
                "Category name is required"
            );

            return;

        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(
                "http://localhost:5000/api/categories",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        name:
                            formData.name.trim(),

                        description:
                            formData.description.trim()

                    })

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to create category"
                );

            }


            setCategories((previousCategories) => [

                ...previousCategories,

                data.category

            ].sort((a, b) =>
                a.name.localeCompare(b.name)
            ));


            setSuccess(
                "Category created successfully."
            );


            resetForm();


        } catch (error) {

            console.error(
                "Create category error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setSaving(false);

        }

    };


    // ============================================================
    // START EDITING
    // ============================================================

    const handleEdit = (category) => {

        setEditingCategoryId(
            category._id
        );


        setFormData({

            name:
                category.name || "",

            description:
                category.description || ""

        });


        setError("");

        setSuccess("");


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


    // ============================================================
    // UPDATE CATEGORY
    // ============================================================

    const handleUpdateCategory = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        if (!formData.name.trim()) {

            setError(
                "Category name is required"
            );

            return;

        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(

                `http://localhost:5000/api/categories/${editingCategoryId}`,

                {
                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        name:
                            formData.name.trim(),

                        description:
                            formData.description.trim(),

                        isActive: true

                    })

                }

            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update category"
                );

            }


            setCategories((previousCategories) =>

                previousCategories.map(
                    (category) =>

                        category._id ===
                        editingCategoryId

                            ? data.category

                            : category

                )

            );


            setSuccess(
                "Category updated successfully."
            );


            resetForm();


        } catch (error) {

            console.error(
                "Update category error:",
                error
            );

            setError(
                error.message
            );

        } finally {

            setSaving(false);

        }

    };


    // ============================================================
    // DELETE / DEACTIVATE CATEGORY
    // ============================================================

    const handleDelete = async (categoryId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to deactivate this category?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setError("");

            setSuccess("");


            const token =
                localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;

            }


            const response = await fetch(

                `http://localhost:5000/api/categories/${categoryId}`,

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
                    "Failed to delete category"
                );

            }


            // ----------------------------------------------------
            // Since backend uses soft delete,
            // remove it from the active list.
            // ----------------------------------------------------

            setCategories(
                (previousCategories) =>

                    previousCategories.filter(
                        (category) =>
                            category._id !==
                            categoryId
                    )

            );


            setSuccess(
                "Category deactivated successfully."
            );


        } catch (error) {

            console.error(
                "Delete category error:",
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

            <div className="admin-page">

                <h2>
                    Loading categories...
                </h2>

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
                        Category Management
                    </h1>

                    <p>
                        Add, update and manage product
                        categories.
                    </p>

                </div>

            </div>


            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (

                <div className="admin-error">

                    {error}

                </div>

            )}


            {/* ====================================================
                SUCCESS
            ==================================================== */}

            {success && (

                <div className="admin-success">

                    {success}

                </div>

            )}


            {/* ====================================================
                CATEGORY FORM
            ==================================================== */}

            <div className="admin-form-card">

                <h2>

                    {editingCategoryId
                        ? "Update Category"
                        : "Add New Category"}

                </h2>


                <form

                    onSubmit={
                        editingCategoryId
                            ? handleUpdateCategory
                            : handleCreateCategory
                    }

                >

                    {/* NAME */}

                    <div className="form-group">

                        <label>
                            Category Name
                        </label>

                        <input

                            type="text"

                            name="name"

                            value={
                                formData.name
                            }

                            onChange={
                                handleChange
                            }

                            placeholder="Enter category name"

                        />

                    </div>


                    {/* DESCRIPTION */}

                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea

                            name="description"

                            value={
                                formData.description
                            }

                            onChange={
                                handleChange
                            }

                            placeholder="Enter category description"

                            rows="4"

                        />

                    </div>


                    {/* BUTTONS */}

                    <div className="form-actions">

                        <button

                            type="submit"

                            disabled={saving}

                        >

                            {saving

                                ? "Saving..."

                                : editingCategoryId
                                    ? "Update Category"
                                    : "Add Category"}

                        </button>


                        {editingCategoryId && (

                            <button

                                type="button"

                                onClick={resetForm}

                                disabled={saving}

                            >

                                Cancel

                            </button>

                        )}

                    </div>

                </form>

            </div>


            {/* ====================================================
                CATEGORY LIST
            ==================================================== */}

            <div className="admin-list-section">

                <div className="admin-list-header">

                    <h2>
                        Categories
                    </h2>

                    <span>
                        {categories.length} active
                        categories
                    </span>

                </div>


                {categories.length === 0 ? (

                    <div>

                        <p>
                            No categories found.
                        </p>

                    </div>

                ) : (

                    <div className="admin-category-list">

                        {categories.map(
                            (category) => (

                                <div

                                    className="admin-category-card"

                                    key={
                                        category._id
                                    }

                                >

                                    {/* CATEGORY INFO */}

                                    <div>

                                        <h3>
                                            {
                                                category.name
                                            }
                                        </h3>


                                        <p>

                                            {category.description ||
                                                "No description"}

                                        </p>


                                        <small>

                                            Created:{" "}

                                            {category.createdAt
                                                ? new Date(
                                                    category.createdAt
                                                ).toLocaleDateString()
                                                : "N/A"}

                                        </small>

                                    </div>


                                    {/* ACTIONS */}

                                    <div className="category-actions">

                                        <button

                                            type="button"

                                            onClick={() =>
                                                handleEdit(
                                                    category
                                                )
                                            }

                                        >

                                            Edit

                                        </button>


                                        <button

                                            type="button"

                                            onClick={() =>
                                                handleDelete(
                                                    category._id
                                                )
                                            }

                                        >

                                            Deactivate

                                        </button>

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


export default AdminCategories;