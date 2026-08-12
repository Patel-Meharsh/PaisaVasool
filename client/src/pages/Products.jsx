import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // FETCH CATEGORIES
    // ============================================================

    const fetchCategories = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/categories"
            );

            const data = await response.json();

            if (response.ok) {
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error("Category fetch error:", error);
        }
    };

    // ============================================================
    // FETCH PRODUCTS
    // ============================================================

    const fetchProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (search.trim()) {
                params.append("search", search.trim());
            }

            if (selectedCategory) {
                params.append("category", selectedCategory);
            }

            if (minPrice !== "") {
                params.append("minPrice", minPrice);
            }

            if (maxPrice !== "") {
                params.append("maxPrice", maxPrice);
            }

            if (sort) {
                params.append("sort", sort);
            }

            params.append("page", page);
            params.append("limit", 12);

            const url =
                `http://localhost:5000/api/products?${params.toString()}`;

            const response = await fetch(url);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch products"
                );
            }

            setProducts(data.products || []);
            setPagination(data.pagination || null);

        } catch (error) {
            console.error("Products error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        fetchCategories();
    }, []);

    // ============================================================
    // FETCH WHEN FILTERS CHANGE
    // ============================================================

    useEffect(() => {
        fetchProducts();
    }, [
        page,
        selectedCategory,
        sort
    ]);

    // ============================================================
    // SEARCH
    // ============================================================

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        fetchProducts();
    };

    // ============================================================
    // FILTER
    // ============================================================

    const handleFilter = (event) => {
        event.preventDefault();
        setPage(1);
        fetchProducts();
    };

    // ============================================================
    // CLEAR FILTERS
    // ============================================================

    const handleClearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setMinPrice("");
        setMaxPrice("");
        setSort("");
        setPage(1);
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="products-page">
                <h2>Loading products...</h2>
            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error) {
        return (
            <div className="products-page">
                <h2>Something went wrong</h2>
                <p>{error}</p>

                <button onClick={fetchProducts}>
                    Try Again
                </button>
            </div>
        );
    }

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="products-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="products-header">

                <div>
                    <h1>Products</h1>

                    {pagination && (
                        <p>
                            {pagination.totalProducts} products available
                        </p>
                    )}
                </div>

                <Link to="/cart">
                    View Cart
                </Link>

            </div>

            {/* ====================================================
                SEARCH
            ==================================================== */}

            <form
                className="product-search"
                onSubmit={handleSearch}
            >

                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

                <button type="submit">
                    Search
                </button>

            </form>

            {/* ====================================================
                FILTERS
            ==================================================== */}

            <form
                className="product-filters"
                onSubmit={handleFilter}
            >

                <select
                    value={selectedCategory}
                    onChange={(event) => {
                        setSelectedCategory(event.target.value);
                        setPage(1);
                    }}
                >

                    <option value="">
                        All Categories
                    </option>

                    {categories.map((category) => (
                        <option
                            key={category._id}
                            value={category._id}
                        >
                            {category.name}
                        </option>
                    ))}

                </select>

                <input
                    type="number"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(event) =>
                        setMinPrice(event.target.value)
                    }
                />

                <input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(event) =>
                        setMaxPrice(event.target.value)
                    }
                />

                <select
                    value={sort}
                    onChange={(event) => {
                        setSort(event.target.value);
                        setPage(1);
                    }}
                >

                    <option value="">
                        Sort By
                    </option>

                    <option value="price_asc">
                        Price: Low to High
                    </option>

                    <option value="price_desc">
                        Price: High to Low
                    </option>

                    <option value="name_asc">
                        Name: A to Z
                    </option>

                    <option value="name_desc">
                        Name: Z to A
                    </option>

                </select>

                <button type="submit">
                    Apply
                </button>

                <button
                    type="button"
                    onClick={handleClearFilters}
                >
                    Clear
                </button>

            </form>

            {/* ====================================================
                SEARCH INFORMATION
            ==================================================== */}

            {search && (
                <p className="search-info">
                    Search results for:
                    <strong> "{search}"</strong>
                </p>
            )}

            {/* ====================================================
                PRODUCTS
            ==================================================== */}

            {products.length === 0 ? (

                <div className="no-products">
                    <h2>No products found</h2>

                    <p>
                        Try changing your search or filters.
                    </p>

                </div>

            ) : (

                <div className="products-grid">

                    {products.map((product) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                        />
                    ))}

                </div>

            )}

            {/* ====================================================
                PAGINATION
            ==================================================== */}

            {pagination && pagination.totalPages > 1 && (

                <div className="pagination">

                    <button
                        disabled={!pagination.hasPreviousPage}
                        onClick={() =>
                            setPage((previousPage) =>
                                previousPage - 1
                            )
                        }
                    >
                        Previous
                    </button>

                    <span>
                        Page {pagination.currentPage} of{" "}
                        {pagination.totalPages}
                    </span>

                    <button
                        disabled={!pagination.hasNextPage}
                        onClick={() =>
                            setPage((previousPage) =>
                                previousPage + 1
                            )
                        }
                    >
                        Next
                    </button>

                </div>

            )}

        </div>
    );
}

export default Products;