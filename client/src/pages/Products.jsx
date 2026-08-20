import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import "../styles/ProductsPage.css";

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

    const fetchProducts = async (overrides = {}) => {
        setLoading(true);
        setError("");

        try {
            const currentSearch = overrides.search ?? search;
            const currentCategory =
                overrides.selectedCategory ?? selectedCategory;
            const currentMinPrice = overrides.minPrice ?? minPrice;
            const currentMaxPrice = overrides.maxPrice ?? maxPrice;
            const currentSort = overrides.sort ?? sort;
            const currentPage = overrides.page ?? page;

            const params = new URLSearchParams();

            if (currentSearch.trim()) {
                params.append("search", currentSearch.trim());
            }

            if (currentCategory) {
                params.append("category", currentCategory);
            }

            if (currentMinPrice !== "") {
                params.append("minPrice", currentMinPrice);
            }

            if (currentMaxPrice !== "") {
                params.append("maxPrice", currentMaxPrice);
            }

            if (currentSort) {
                params.append("sort", currentSort);
            }

            params.append("page", currentPage);
            params.append("limit", 12);

            const response = await fetch(
                `http://localhost:5000/api/products?${params.toString()}`
            );

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

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page, selectedCategory, sort]);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        fetchProducts({ page: 1 });
    };

    const handleFilter = (event) => {
        event.preventDefault();
        setPage(1);
        fetchProducts({ page: 1 });
    };

    const handleClearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setMinPrice("");
        setMaxPrice("");
        setSort("");
        setPage(1);

        fetchProducts({
            search: "",
            selectedCategory: "",
            minPrice: "",
            maxPrice: "",
            sort: "",
            page: 1
        });
    };

    if (loading) {
        return (
            <div className="products-page">
                <h2>Loading products...</h2>
            </div>
        );
    }

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

    return (
        <div className="products-page">
            <div className="products-header">
                <div>
                    <h1>Products</h1>
                    {pagination && (
                        <p>
                            {pagination.totalProducts} products available
                        </p>
                    )}
                </div>
            </div>

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

                <button
                    type="button"
                    className="product-clear-button"
                    onClick={handleClearFilters}
                >
                    Clear
                </button>
            </form>

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
            </form>

            {search && (
                <p className="search-info">
                    Search results for:
                    <strong> "{search}"</strong>
                </p>
            )}

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
