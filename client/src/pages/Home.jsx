import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingRecommendations, setLoadingRecommendations] =
        useState(false);

    const token = localStorage.getItem("token");

    // ============================================================
    // FETCH PRODUCTS
    // ============================================================

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/products"
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch products"
                    );
                }

                setProducts(data.products || data || []);
            } catch (error) {
                console.error("Products error:", error);
                setProducts([]);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, []);

    // ============================================================
    // FETCH RECOMMENDATIONS
    // ONLY LOGGED-IN USERS
    // ============================================================

    useEffect(() => {
        if (!token) {
            return;
        }

        const fetchRecommendations = async () => {
            try {
                setLoadingRecommendations(true);

                const response = await fetch(
                    "http://localhost:5000/api/products/recommendations",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch recommendations"
                    );
                }

                setRecommendations(data.recommendations || []);
            } catch (error) {
                console.error("Recommendation error:", error);
                setRecommendations([]);
            } finally {
                setLoadingRecommendations(false);
            }
        };

        fetchRecommendations();
    }, [token]);

    // ============================================================
    // PRODUCT CARD
    // ============================================================

    const ProductCard = ({ product }) => {
        return (
            <article className="home-product-card">

                <div className="home-product-image">
                    {product.images && product.images.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                        />
                    ) : (
                        <div className="product-no-image">
                            No Image
                        </div>
                    )}
                </div>

                <div className="home-product-info">

                    <span className="product-stock">
                        {product.stock > 0
                            ? "IN STOCK"
                            : "OUT OF STOCK"}
                    </span>

                    <h3>
                        {product.name}
                    </h3>

                    <p className="product-category">
                        {product.category?.name ||
                            product.category ||
                            "Products"}
                    </p>

                    <p className="home-product-price">
                        ₹{product.price}
                    </p>

                    <button
                        onClick={() =>
                            navigate(`/products/${product._id}`)
                        }
                    >
                        VIEW PRODUCT
                    </button>

                </div>

            </article>
        );
    };

    return (
        <main className="home-page">

            {/* ====================================================
                HERO
            ==================================================== */}

            <section className="home-hero">

                <div className="hero-overlay"></div>

                <div className="hero-content">

                    <span>
                        PAISAVASOOL EXCLUSIVE COLLECTION
                    </span>

                    <h1>
                        SMART SHOPPING.
                        <br />
                        FULL VALUE.
                    </h1>

                    <p>
                        Har Deal, Full Value.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/products")
                        }
                    >
                        SHOP NOW →
                    </button>

                </div>

            </section>


            {/* ====================================================
                BENEFITS
            ==================================================== */}

            <section className="benefits-section">

                <div className="benefit-item">

                    <span className="benefit-icon">
                        🚚
                    </span>

                    <div>
                        <h3>
                            FREE DELIVERY
                        </h3>

                        <p>
                            Free shipping on selected orders
                        </p>
                    </div>

                </div>


                <div className="benefit-item">

                    <span className="benefit-icon">
                        ↩
                    </span>

                    <div>
                        <h3>
                            EASY RETURNS
                        </h3>

                        <p>
                            Hassle-free return policy
                        </p>
                    </div>

                </div>


                <div className="benefit-item">

                    <span className="benefit-icon">
                        🔒
                    </span>

                    <div>
                        <h3>
                            SECURE PAYMENT
                        </h3>

                        <p>
                            Safe and secure checkout
                        </p>
                    </div>

                </div>


                <div className="benefit-item">

                    <span className="benefit-icon">
                        %
                    </span>

                    <div>
                        <h3>
                            BEST DEALS
                        </h3>

                        <p>
                            More value on every purchase
                        </p>
                    </div>

                </div>

            </section>


            {/* ====================================================
                BESTSELLER
            ==================================================== */}

            <section className="home-products-section">

                <div className="section-heading">

                    <h2>
                        BESTSELLER
                    </h2>

                    <span></span>

                </div>


                {loadingProducts ? (

                    <div className="section-loading">
                        Loading products...
                    </div>

                ) : (

                    <div className="home-products-grid">

                        {products
                            .slice(0, 8)
                            .map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                />
                            ))}

                    </div>

                )}

            </section>


            {/* ====================================================
                PROMOTIONAL BANNER
            ==================================================== */}

            <section className="promotion-section">

                <div className="promotion-box">

                    <div>

                        <span>
                            PAISAVASOOL SPECIAL
                        </span>

                        <h2>
                            DEALS THAT
                            <br />
                            MAKE SENSE
                        </h2>

                        <button
                            onClick={() =>
                                navigate("/products")
                            }
                        >
                            EXPLORE DEALS →
                        </button>

                    </div>

                </div>


                <div className="promotion-box promotion-orange">

                    <div>

                        <span>
                            MORE VALUE
                        </span>

                        <h2>
                            SHOP MORE.
                            <br />
                            SAVE MORE.
                        </h2>

                        <button
                            onClick={() =>
                                navigate("/products")
                            }
                        >
                            SHOP NOW →
                        </button>

                    </div>

                </div>

            </section>


            {/* ====================================================
                RECOMMENDATIONS
            ==================================================== */}

            {token && (

                <section className="home-products-section recommendations-home">

                    <div className="section-heading">

                        <h2>
                            RECOMMENDED FOR YOU
                        </h2>

                        <span></span>

                    </div>

                    <p className="section-subtitle">
                        Handpicked based on your shopping activity.
                    </p>


                    {loadingRecommendations ? (

                        <div className="section-loading">
                            Loading recommendations...
                        </div>

                    ) : recommendations.length === 0 ? (

                        <div className="empty-recommendations">

                            <p>
                                Start exploring products and we'll
                                recommend products for you.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/products")
                                }
                            >
                                EXPLORE PRODUCTS
                            </button>

                        </div>

                    ) : (

                        <div className="home-products-grid">

                            {recommendations
                                .slice(0, 8)
                                .map((product) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                    />
                                ))}

                        </div>

                    )}

                </section>

            )}


            {/* ====================================================
                VALUE BANNER
            ==================================================== */}

            <section className="value-banner">

                <div className="value-banner-content">

                    <span>
                        WHY PAY MORE?
                    </span>

                    <h2>
                        HAR DEAL,
                        <br />
                        FULL VALUE.
                    </h2>

                    <p>
                        Quality products. Better prices.
                        Smarter shopping.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/products")
                        }
                    >
                        SHOP PAISAVASOOL →
                    </button>

                </div>

            </section>


            {/* ====================================================
                TESTIMONIAL
            ==================================================== */}

            <section className="testimonial-section">

                <div className="testimonial-content">

                    <span className="quote-mark">
                        “
                    </span>

                    <p>
                        Great products, great prices and
                        a shopping experience that actually
                        feels worth it.
                    </p>

                    <strong>
                        PAISAVASOOL CUSTOMER
                    </strong>

                </div>

            </section>


            {/* ====================================================
                FOOTER
            ==================================================== */}

            <footer className="footer">

                <div className="footer-content">

                    <div className="footer-brand">

                        <h2>
                            PaisaVasool
                        </h2>

                        <p>
                            Shop smart. Save more. Get more.
                        </p>

                    </div>


                    <div className="footer-links">

                        <Link to="/">
                            Home
                        </Link>

                        <Link to="/products">
                            Products
                        </Link>

                        <Link to="/cart">
                            Cart
                        </Link>

                    </div>


                    <div className="footer-info">

                        <p>
                            Quality products. Better prices.
                        </p>

                        <p>
                            © 2026 PaisaVasool
                        </p>

                    </div>

                </div>

            </footer>

        </main>
    );
}

export default Home;