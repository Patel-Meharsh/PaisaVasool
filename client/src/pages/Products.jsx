import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

function Products() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [search, setSearch] = useState(
        searchParams.get("search") || ""
    );
    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get("category") || ""
    );
    const [selectedSubcategory, setSelectedSubcategory] = useState(
        searchParams.get("subcategory") || ""
    );
    const [selectedBrand, setSelectedBrand] = useState(
        searchParams.get("brand") || ""
    );
    const [minPrice, setMinPrice] = useState(
        searchParams.get("minPrice") || ""
    );
    const [maxPrice, setMaxPrice] = useState(
        searchParams.get("maxPrice") || ""
    );
    const [sort, setSort] = useState(
        searchParams.get("sort") || ""
    );

    const [pagination, setPagination] = useState(null);
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
                        data.message || "Failed to fetch categories"
                    );
                }

                setCategories(data.categories || []);
            } catch (requestError) {
                console.error(
                    "Category fetch error:",
                    requestError
                );
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchFacets = async () => {
            try {
                const category = searchParams.get("category") || "";

                const url = category
                    ? `http://localhost:5000/api/products/facets?category=${encodeURIComponent(
                          category
                      )}`
                    : "http://localhost:5000/api/products/facets";

                const response = await fetch(url);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch filters"
                    );
                }

                setSubcategories(data.subcategories || []);
                setBrands(data.brands || []);
            } catch (requestError) {
                console.error(
                    "Product facets error:",
                    requestError
                );

                setSubcategories([]);
                setBrands([]);
            }
        };

        fetchFacets();
    }, [searchParams]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams(searchParams);

                if (!params.get("page")) {
                    params.set("page", "1");
                }

                params.set("limit", "12");

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
            } catch (requestError) {
                console.error(
                    "Products error:",
                    requestError
                );
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams]);

    useEffect(() => {
        setSearch(searchParams.get("search") || "");
        setSelectedCategory(searchParams.get("category") || "");
        setSelectedSubcategory(
            searchParams.get("subcategory") || ""
        );
        setSelectedBrand(searchParams.get("brand") || "");
        setMinPrice(searchParams.get("minPrice") || "");
        setMaxPrice(searchParams.get("maxPrice") || "");
        setSort(searchParams.get("sort") || "");
    }, [searchParams]);

    const handleApply = (event) => {
        event.preventDefault();

        const nextParams = {};

        if (search.trim()) {
            nextParams.search = search.trim();
        }

        if (selectedCategory) {
            nextParams.category = selectedCategory;
        }

        if (selectedSubcategory) {
            nextParams.subcategory = selectedSubcategory;
        }

        if (selectedBrand) {
            nextParams.brand = selectedBrand;
        }

        if (minPrice !== "") {
            nextParams.minPrice = minPrice;
        }

        if (maxPrice !== "") {
            nextParams.maxPrice = maxPrice;
        }

        if (sort) {
            nextParams.sort = sort;
        }

        nextParams.page = "1";
        setSearchParams(nextParams);
    };

    const handleCategoryChange = (event) => {
        const category = event.target.value;

        setSelectedCategory(category);
        setSelectedSubcategory("");
        setSelectedBrand("");

        const nextParams = {};

        if (search.trim()) {
            nextParams.search = search.trim();
        }

        if (category) {
            nextParams.category = category;
        }

        if (minPrice !== "") {
            nextParams.minPrice = minPrice;
        }

        if (maxPrice !== "") {
            nextParams.maxPrice = maxPrice;
        }

        if (sort) {
            nextParams.sort = sort;
        }

        nextParams.page = "1";
        setSearchParams(nextParams);
    };

    const handleSortChange = (event) => {
        const nextSort = event.target.value;
        setSort(nextSort);

        const nextParams = Object.fromEntries(
            searchParams.entries()
        );

        if (nextSort) {
            nextParams.sort = nextSort;
        } else {
            delete nextParams.sort;
        }

        nextParams.page = "1";
        setSearchParams(nextParams);
    };

    const handleClearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setSelectedSubcategory("");
        setSelectedBrand("");
        setMinPrice("");
        setMaxPrice("");
        setSort("");
        setSearchParams({ page: "1" });
    };

    const changePage = (nextPage) => {
        const nextParams = Object.fromEntries(
            searchParams.entries()
        );

        nextParams.page = String(nextPage);
        setSearchParams(nextParams);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const activeCategory = categories.find(
        (category) => category._id === selectedCategory
    );

    const activeFilterCount = [
        selectedCategory,
        selectedSubcategory,
        selectedBrand,
        minPrice,
        maxPrice,
        sort
    ].filter(Boolean).length;

    if (loading) {
        return (
            <main className="products-page">
                <div className="shop-loading">
                    Loading products...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="products-page">
                <div className="products-error-state">
                    <h2>Something went wrong</h2>
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="products-page">
            <header className="products-header">
                <div>
                    <h1>{activeCategory?.name || "Products"}</h1>

                    {pagination && (
                        <p>
                            <strong>{pagination.totalProducts}</strong>{" "}
                            products available
                        </p>
                    )}
                </div>
            </header>

            <div className="products-layout">
                <aside className="product-filter-sidebar">
                    <form
                        className="product-filter-card"
                        onSubmit={handleApply}
                    >
                        <div className="product-filter-heading">
                            <div>
                                <h2>Filter</h2>
                                <p>
                                    {activeFilterCount > 0
                                        ? `${activeFilterCount} active filter${
                                              activeFilterCount > 1
                                                  ? "s"
                                                  : ""
                                          }`
                                        : "Refine your results"}
                                </p>
                            </div>

                            {activeFilterCount > 0 && (
                                <span className="product-filter-count">
                                    {activeFilterCount}
                                </span>
                            )}
                        </div>

                        <div className="product-filter-fields">
                            <label>
                                <span>Category</span>
                                <select
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
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
                            </label>

                            <label>
                                <span>Type</span>
                                <select
                                    value={selectedSubcategory}
                                    onChange={(event) =>
                                        setSelectedSubcategory(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        All Types
                                    </option>

                                    {subcategories.map((subcategory) => (
                                        <option
                                            key={subcategory}
                                            value={subcategory}
                                        >
                                            {subcategory}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Brand</span>
                                <select
                                    value={selectedBrand}
                                    onChange={(event) =>
                                        setSelectedBrand(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        All Brands
                                    </option>

                                    {brands.map((brand) => (
                                        <option
                                            key={brand}
                                            value={brand}
                                        >
                                            {brand}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="price-filter-row">
                                <label>
                                    <span>Min Price</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="₹ Min"
                                        value={minPrice}
                                        onChange={(event) =>
                                            setMinPrice(
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>

                                <label>
                                    <span>Max Price</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="₹ Max"
                                        value={maxPrice}
                                        onChange={(event) =>
                                            setMaxPrice(
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            <label>
                                <span>Sort By</span>
                                <select
                                    value={sort}
                                    onChange={handleSortChange}
                                >
                                    <option value="">
                                        Default
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
                            </label>
                        </div>

                        <div className="product-filter-actions">
                            <button type="submit">
                                Apply
                            </button>

                            <button
                                type="button"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </aside>

                <section className="products-catalog">
                    <form
                        className="product-search"
                        onSubmit={handleApply}
                    >
                        <input
                            type="text"
                            placeholder="Search products, brands or types..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            autoComplete="off"
                        />

                        <button type="submit">
                            Search
                        </button>
                    </form>

                    <div className="catalog-filter-summary">
                        <span>
                            Showing <strong>{products.length}</strong> of{" "}
                            <strong>
                                {pagination?.totalProducts || 0}
                            </strong>
                        </span>

                        {selectedSubcategory && (
                            <span>
                                Type: <strong>{selectedSubcategory}</strong>
                            </span>
                        )}
                    </div>

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
                                type="button"
                                disabled={!pagination.hasPreviousPage}
                                onClick={() =>
                                    changePage(
                                        pagination.currentPage - 1
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
                                type="button"
                                disabled={!pagination.hasNextPage}
                                onClick={() =>
                                    changePage(
                                        pagination.currentPage + 1
                                    )
                                }
                            >
                                Next
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Products;
