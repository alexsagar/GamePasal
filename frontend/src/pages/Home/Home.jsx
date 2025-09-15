import React, { useState, useEffect, useRef } from 'react';
import SEO from '../../components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Star, TrendingUp, Gift, Zap, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import './Home.css';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import NewsletterBanner from '../../components/NewsletterBanner/NewsletterBanner';
import Reviews from '../../components/Reviews/Reviews';
import Benefits from '../../components/Benefits/Benefits';

// Helper to ensure proper slides per view for mobile-first design
const getSlidesPerView = (length) => ({
  320: { slidesPerView: Math.min(2, length), spaceBetween: 12 },
  480: { slidesPerView: Math.min(2, length), spaceBetween: 16 },
  768: { slidesPerView: Math.min(3, length), spaceBetween: 16 },
  1024: { slidesPerView: Math.min(4, length), spaceBetween: 20 },
  1200: { slidesPerView: Math.min(4, length), spaceBetween: 24 }
});

const Home = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [preOrderGames, setPreOrderGames] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [giftCardsLoading, setGiftCardsLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [software, setSoftware] = useState([]);
  const [softwareLoading, setSoftwareLoading] = useState(true);
  const [preOrderGamesLoading, setPreOrderGamesLoading] = useState(true);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Refs for horizontal rows
  const featuredRef = useRef(null);
  const topRef = useRef(null);
  const trendingRef = useRef(null);
  const bestRef = useRef(null);
  const preorderRef = useRef(null);
  const giftRef = useRef(null);

  const scrollRow = (ref, dir = 1) => {
    if (!ref?.current) return;
    const amount = ref.current.clientWidth; // one viewport width
    ref.current.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  // Hero banners
  useEffect(() => {
    const fetchBanners = async () => {
      setHeroLoading(true);
      try {
        const res = await api.get('/banners?isActive=true');
        setHeroSlides(res.data.data || []);
      } catch (err) {
        setHeroSlides([]);
      } finally {
        setHeroLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Featured & section products
  useEffect(() => {
    fetchFeaturedProducts();
    fetchHomepageSections();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true);
      const response = await api.get('/products/featured');
      setFeaturedProducts(response.data.data);
    } catch (error) {
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchHomepageSections = async () => {
    try {
      const top = (await api.get('/products?isTopSeller=true&limit=6')).data.data;
      const trending = (await api.get('/products?isTrending=true&limit=6')).data.data;
      const best = (await api.get('/products?isBestSelling=true&limit=6')).data.data;
      const preorder = (await api.get('/products?isPreOrder=true')).data.data;

      // Only include category === 'Game' for these sections
      setTopSellers(top.filter(p => p.category === 'Game'));
      setTrendingProducts(trending.filter(p => p.category === 'Game'));
      setBestSelling(best.filter(p => p.category === 'Game'));
      setPreOrderGames(preorder.filter(p => p.category === 'Game'));
    } catch {
      setTopSellers([]);
      setTrendingProducts([]);
      setBestSelling([]);
      setPreOrderGames([]);
    }
  };

  // Fetch only Pre-Order products
  useEffect(() => {
    const fetchPreOrderGames = async () => {
      setPreOrderGamesLoading(true);
      try {
        const response = await api.get('/products/preorder');
        setPreOrderGames(response.data.data.filter(p => p.category === 'Game'));
      } catch (error) {
        setPreOrderGames([]);
      } finally {
        setPreOrderGamesLoading(false);
      }
    };
    fetchPreOrderGames();
  }, []);

  // Fetch gift cards
  useEffect(() => {
    const fetchGiftCards = async () => {
      setGiftCardsLoading(true);
      try {
        const response = await api.get('/products/gift-cards');
        setGiftCards(response.data.data);
      } catch (error) {
        setGiftCards([]);
      } finally {
        setGiftCardsLoading(false);
      }
    };
    fetchGiftCards();
  }, []);

  // Fetch software
  useEffect(() => {
    const fetchSoftware = async () => {
      setSoftwareLoading(true);
      try {
        const response = await api.get('/products/software');
        setSoftware(response.data.data);
      } catch (error) {
        setSoftware([]);
      } finally {
        setSoftwareLoading(false);
      }
    };
    fetchSoftware();
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const apply = () => setIsMobile(!!mql.matches);
    apply();
    const onChange = (e) => setIsMobile(!!e.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => { if (mql.removeEventListener) mql.removeEventListener('change', onChange); else mql.removeListener(onChange); };
  }, []);

  // Helper for discount calculation (optional use)
  const getDiscountPercentage = (price, salePrice) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  return (
    <div className="home">
      <SEO
        title="Buy Game Gift Cards in Nepal | GamePasal"
        description="Buy PlayStation, Xbox, Steam, and PC game gift cards in Nepal with instant delivery. Pay via eSewa, Khalti, or bank transfer at GamePasal."
        keywords="game gift cards Nepal, buy PlayStation gift cards, Xbox gift cards Nepal, Steam wallet Nepal, PC game top-up Nepal"
        canonical="https://www.gamepasal.com/"
      />

      {/* Hero Bento Section */}
      <section className="hero-bento">
        <div className="container">
          <div className="bento-grid">
            {/* Main Hero Card */}
            <div className="bento-card bento-hero-main">
              {heroLoading ? (
                <div className="bento-loading">Loading featured content...</div>
              ) : heroSlides.length > 0 ? (
                <div className="hero-card-content">
                  <div className="hero-background" 
                    style={{
                      backgroundImage: `url(${heroSlides[0].image || heroSlides[0].productId?.image || "/vite.svg"})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                    <div className="hero-overlay">
                      <div className="hero-info">
                        <h1 className="hero-title">{heroSlides[0].title || heroSlides[0].productId?.title || "Welcome to GamePasal"}</h1>
                        <p className="hero-subtitle">{heroSlides[0].subtitle || "Your ultimate gaming destination"}</p>
                        <div className="hero-actions">
                          {heroSlides[0].productId ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => addToCart({ ...heroSlides[0].productId, quantity: 1 })}
                            >
                              {heroSlides[0].buttonLabel || "Buy Now"}
                            </button>
                          ) : (
                            <Link to="/products" className="btn btn-primary">
                              {heroSlides[0].buttonLabel || "Explore Games"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hero-card-content">
                  <div className="hero-background hero-default">
                    <div className="hero-overlay">
                      <div className="hero-info">
                        <h1 className="hero-title">Welcome to GamePasal</h1>
                        <p className="hero-subtitle">Your ultimate gaming destination in Nepal</p>
                        <div className="hero-actions">
                          <Link to="/products" className="btn btn-primary">Explore Games</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PC Games Card */}
            <div className="bento-card game-nav-card">
              <Link to="/products?category=PC" className="game-nav-link">
                <div className="game-nav-wrapper">
                  <div className="game-nav-icon">
                    <Monitor size={32} />
                  </div>
                  <h3 className="game-nav-title">PC Games</h3>
                  <p className="game-nav-desc">Steam, Epic & More</p>
                </div>
              </Link>
            </div>

            {/* PlayStation Games Card */}
            <div className="bento-card game-nav-card">
              <Link to="/products?category=PlayStation" className="game-nav-link">
                <div className="game-nav-wrapper">
                  <div className="game-nav-icon">
                    <Monitor size={32} />
                  </div>
                  <h3 className="game-nav-title">PlayStation</h3>
                  <p className="game-nav-desc">PS4 & PS5 Games</p>
                </div>
              </Link>
            </div>

            {/* Xbox Games Card */}
            <div className="bento-card game-nav-card">
              <Link to="/products?category=Xbox" className="game-nav-link">
                <div className="game-nav-wrapper">
                  <div className="game-nav-icon">
                    <Monitor size={32} />
                  </div>
                  <h3 className="game-nav-title">Xbox Games</h3>
                  <p className="game-nav-desc">Xbox One & Series</p>
                </div>
              </Link>
            </div>

            {/* Gift Cards Card */}
            <div className="bento-card game-nav-card">
              <Link to="/products/gift-cards" className="game-nav-link">
                <div className="game-nav-wrapper">
                  <div className="game-nav-icon">
                    <Gift size={32} />
                  </div>
                  <h3 className="game-nav-title">Gift Cards</h3>
                  <p className="game-nav-desc">Digital Gift Cards</p>
                </div>
              </Link>
            </div>

            {/* Extra Card - Fill empty space */}
            <div className="bento-card game-nav-card">
              <div className="game-nav-wrapper">
                <div className="game-nav-icon">
                  <Star size={24} />
                </div>
                <h3 className="game-nav-title">Special Offers</h3>
                <p className="game-nav-desc">Limited time deals</p>
              </div>
            </div>

            {/* Additional Card */}
            <div className="bento-card game-nav-card">
              <Link to="/products/software" className="game-nav-link">
                <div className="game-nav-wrapper">
                  <div className="game-nav-icon">
                    <Monitor size={32} />
                  </div>
                  <h3 className="game-nav-title">Software</h3>
                  <p className="game-nav-desc">Apps & Tools</p>
                </div>
              </Link>
            </div>


          </div>
        </div>
      </section>

     

      {/* Featured Games Section */}
      <section className="featured-section">
        <div className="container">
          <div className="featured-header section-header-with-controls">
            <div>
              <h2 className="featured-title">Featured Games</h2>
              <p className="featured-subtitle">Discover the most popular games right now</p>
            </div>
            <div className="header-controls">
              <Link to="/products?featured=true" className="view-all-link">VIEW ALL</Link>
              <div className="scroll-controls">
                <button className="scroll-btn" onClick={() => scrollRow(featuredRef, -1)} aria-label="Back"><ChevronLeft size={18} /></button>
                <button className="scroll-btn" onClick={() => scrollRow(featuredRef, 1)} aria-label="Next"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          {featuredLoading ? (
            <div className="featured-loading"><div className="spinner"></div></div>
          ) : (
            <div className="product-row" ref={featuredRef}>
              {featuredProducts.map((product) => (
                <div key={product._id} className="product-row-item">
                  <ProductCard product={product} variant="simple" context="home" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Sellers Section */}
      <section className="top-sellers-section">
        <div className="container">
          <div className="section-header-modern">
            <div className="section-title-modern">
              <div className="title-icon-wrapper">
                <Star className="title-icon" />
              </div>
              <div className="title-content">
                <h2 className="title-main">Top Sellers</h2>
                <p className="title-subtitle">Best performing games this week</p>
              </div>
            </div>
            <div className="header-actions">
              <Link to="/products?sort=bestselling" className="view-all-btn">
                View All
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          <div className="top-sellers-grid">
            {topSellers.slice(0, 6).map((product, index) => (
              <div 
                key={product._id} 
                className={`top-seller-card ${index === 0 ? 'featured-seller' : ''}`}
              >
                <div className="seller-rank">
                  #{index + 1}
                </div>
                <div className="seller-image-container">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    loading="lazy"
                    className="seller-image"
                  />
                  <div className="seller-overlay">
                    <div className="seller-badge">
                      <Star size={14} fill="#ffd700" color="#ffd700" />
                      <span>Top Seller</span>
                    </div>
                  </div>
                </div>
                <div className="seller-info">
                  <div className="seller-meta">
                    <span className="seller-platform">{product.platform}</span>
                    {product.rating && (
                      <div className="seller-rating">
                        <Star size={12} fill="#ffd700" color="#ffd700" />
                        <span>{product.rating}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="seller-title">{product.title}</h3>
                  <div className="seller-price">
                    <span className="current-price">
                      NRS {product.salePrice ? product.salePrice : product.price}
                    </span>
                    {product.salePrice && (
                      <span className="original-price">NRS {product.price}</span>
                    )}
                  </div>
                  <button 
                    className="seller-buy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 1);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Banner */}
  <section style={{ marginTop: 24, marginBottom: 24 }}>
        <NewsletterBanner />
      </section>

      {/* Trending Products Section */}
      <section className="trending-section">
        <div className="container">
          <div className="section-header section-header-with-controls">
            <div className="section-title-with-icon">
              <TrendingUp className="section-icon" />
              <h2 className="section-title">Trending Products</h2>
            </div>
            <div className="header-controls">
              <Link to="/products?sort=trending" className="view-all-link">VIEW ALL</Link>
              <div className="scroll-controls">
                <button className="scroll-btn" onClick={() => scrollRow(trendingRef, -1)} aria-label="Back"><ChevronLeft size={18} /></button>
                <button className="scroll-btn" onClick={() => scrollRow(trendingRef, 1)} aria-label="Next"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          <div className="product-row" ref={trendingRef}>
            {trendingProducts.map((product) => (
              <div key={product._id} className="product-row-item">
                <ProductCard product={product} variant="simple" context="home" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Selling Section */}
      <section className="best-selling">
        <div className="container">
          <div className="section-header section-header-with-controls">
            <h2 className="section-title">Best Selling</h2>
            <div className="header-controls">
              <Link to="/products?sort=bestselling" className="view-all-link">VIEW ALL</Link>
              <div className="scroll-controls">
                <button className="scroll-btn" onClick={() => scrollRow(bestRef, -1)} aria-label="Back"><ChevronLeft size={18} /></button>
                <button className="scroll-btn" onClick={() => scrollRow(bestRef, 1)} aria-label="Next"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          <div className="product-row" ref={bestRef}>
            {bestSelling.map((product) => (
              <div key={product._id} className="product-row-item">
                <ProductCard product={product} variant="simple" context="home" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Order Section */}
      <section className="pre-order-section">
        <div className="container">
          <div className="section-header section-header-with-controls">
            <div className="section-title-with-icon">
              <Zap className="section-icon" />
              <h2 className="section-title">Pre-Order Now</h2>
            </div>
            <div className="header-controls">
              <Link to="/products?category=preorder" className="view-all-link">VIEW ALL</Link>
              <div className="scroll-controls">
                <button className="scroll-btn" onClick={() => scrollRow(preorderRef, -1)} aria-label="Back"><ChevronLeft size={18} /></button>
                <button className="scroll-btn" onClick={() => scrollRow(preorderRef, 1)} aria-label="Next"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          <div className="product-row" ref={preorderRef}>
            {preOrderGames.map((product) => (
              <div key={product._id} className="product-row-item">
                <ProductCard product={product} variant="simple" context="home" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews trustpilotUrl="https://www.trustpilot.com/review/example.com" fetchFromApi={false} />

      {/* Gift Cards Section */}
      <section className="gift-cards-section">
        <div className="container">
          <div className="section-header section-header-with-controls">
            <div className="section-title-with-icon">
              <Gift className="section-icon" />
              <h2 className="section-title">Giftcards</h2>
            </div>
            <div className="header-controls">
              <Link to="/products/gift-cards" className="view-all-link">VIEW ALL</Link>
              <div className="scroll-controls">
                <button className="scroll-btn" onClick={() => scrollRow(giftRef, -1)} aria-label="Back"><ChevronLeft size={18} /></button>
                <button className="scroll-btn" onClick={() => scrollRow(giftRef, 1)} aria-label="Next"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          {giftCardsLoading ? (
            <div className="featured-loading"><div className="spinner"></div></div>
          ) : (
            <div className="product-row" ref={giftRef}>
              {giftCards.length > 0 ? (
                giftCards.map((product) => (
                  <div key={product._id} className="product-row-item">
                    <ProductCard product={product} variant="simple" context="home" />
                  </div>
                ))
              ) : (
                <div className="gift-card-placeholder">No gift card deals right now.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Software Section (unchanged) */}
      <section className="software-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-with-icon">
              <Monitor className="section-icon" />
              <h2 className="section-title">Software</h2>
            </div>
            <Link to="/products/software" className="view-all-link">VIEW MORE</Link>
          </div>
          {softwareLoading ? (
            <div className="software-loading">
              <div className="spinner"></div>
            </div>
          ) : software.length > 0 ? (
            <div className="software-showcase">
              {/* Columns retained as-is */}
              <div className="software-column software-left">
                {software.slice(0, 2).map((product, index) => (
                  <div key={product._id} className="software-item software-small">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="software-image"
                        loading="lazy" decoding="async"
                      />
                      <div className="software-overlay">
                        <div className="software-info">
                          <h3 className="software-title">{product.title}</h3>
                          <p className="software-price">
                            {product.salePrice ? (
                              <>
                                <span className="current-price">NRS {product.salePrice}</span>
                                <span className="original-price">NRS {product.price}</span>
                              </>
                            ) : (
                              <span className="current-price">NRS {product.price}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              <div className="software-column software-center">
                {software.slice(2, 3).map((product) => (
                  <div key={product._id} className="software-item software-large">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="software-image"
                        loading="lazy" decoding="async"
                      />
                      <div className="software-overlay">
                        <div className="software-info">
                          <h3 className="software-title">{product.title}</h3>
                          <p className="software-description">{product.description}</p>
                          <p className="software-price">
                            {product.salePrice ? (
                              <>
                                <span className="current-price">NRS {product.salePrice}</span>
                                <span className="original-price">NRS {product.price}</span>
                              </>
                            ) : (
                              <span className="current-price">NRS {product.price}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              <div className="software-column software-right">
                {software.slice(3, 5).map((product, index) => (
                  <div key={product._id} className="software-item software-small">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="software-image"
                        loading="lazy" decoding="async"
                      />
                      <div className="software-overlay">
                        <div className="software-info">
                          <h3 className="software-title">{product.title}</h3>
                          <p className="software-price">
                            {product.salePrice ? (
                              <>
                                <span className="current-price">NRS {product.salePrice}</span>
                                <span className="original-price">NRS {product.price}</span>
                              </>
                            ) : (
                              <span className="current-price">NRS {product.price}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="software-placeholder">
              <p>No software available right now.</p>
            </div>
          )}
        </div>
      </section>
        <Benefits ctaLabel="Shop Now" ctaHref="/products/PC" />
    </div>
  );
};

export default Home;