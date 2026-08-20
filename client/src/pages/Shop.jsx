import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function getCategoryIcon(name = "") {
    const value = name.toLowerCase();

    if (value.includes("electronic")) return "devices";
    if (value.includes("cloth") || value.includes("fashion")) return "checkroom";
    if (value.includes("shoe") || value.includes("footwear")) return "steps";
    if (value.includes("watch")) return "watch";
    if (value.includes("home") || value.includes("decor")) return "home";
    if (value.includes("beauty") || value.includes("personal")) return "face";
    if (value.includes("book")) return "menu_book";
    if (value.includes("sport")) return "sports_soccer";
    if (value.includes("grocery")) return "shopping_basket";
    if (value.includes("toy")) return "toys";

    return "category";
}

function Shop() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/categories"
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load categories"
                    );
                }

                setCategories(data.categories || []);
            } catch (requestError) {
                console.error(
                    "Shop categories error:",
                    requestError
                );
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();

        if (!search.trim()) return;

        navigate(
            `/products?search=${encodeURIComponent(
                search.trim()
            )}`
        );
    };

    return (
        <main className="shop-page">
            <div className="shop-header">
                <h1>Shop by Category</h1>

                <p>
                    Browse PaisaVasool by category and discover products
                    that match what you are looking for.
                </p>

                <form
                    className="shop-search"
                    onSubmit={handleSearch}
                >
                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search the entire catalogue..."
                        autoComplete="off"
                    />

                    <button type="submit">
                        Search
                    </button>
                </form>
            </div>

            {loading && (
                <div className="shop-loading">
                    Loading categories...
                </div>
            )}

            {!loading && error && (
                <div className="shop-error">
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <div className="shop-empty">
                    <h2>No categories available yet.</h2>
                    <p>
                        Categories will appear here as the catalogue grows.
                    </p>
                </div>
            )}

            {!loading && !error && categories.length > 0 && (
                <div className="shop-category-grid">
                    {categories.map((category) => (
                        <Link
                            key={category._id}
                            to={`/products?category=${encodeURIComponent(
                                category._id
                            )}`}
                            className="shop-category-card"
                        >
                            <span className="shop-category-icon">
                                <span className="material-symbols-outlined">
                                    {getCategoryIcon(category.name)}
                                </span>
                            </span>

                            <h2>{category.name}</h2>

                            {category.description && (
                                <p>{category.description}</p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}

export default Shop;