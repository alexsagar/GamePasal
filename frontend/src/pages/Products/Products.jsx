import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import api from '../../services/api'; // Make sure you import your API utility
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './Products.css';

const Products = () => {
  const { category } = useParams(); // e.g., 'pc', 'playstation', etc.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const GIFT_CARD_PLATFORMS = [
    { key: 'Steam', label: 'Steam Gift Cards' },
    { key: 'PlayStation', label: 'PlayStation Gift Cards' },
    { key: 'Xbox', label: 'Xbox Gift Cards' },
    { key: 'iTunes', label: 'iTunes Gift Cards' },
  ];


  const searchQuery = searchParams.get('search') || '';
  const platformFilter = searchParams.get('platform') || '';
  const genreFilter = searchParams.get('genre') || '';
  const priceRange = searchParams.get('priceRange') || '';
  const ratingFilter = searchParams.get('rating') || '';
  const featuredFilter = searchParams.get('featured') || '';
  const trendingFilter = searchParams.get('isTrending') || '';
  const topSellerFilter = searchParams.get('isTopSeller') || '';
  const bestSellingFilter = searchParams.get('isBestSelling') || '';
  const preOrderFilter = searchParams.get('isPreOrder') || '';
  const queryCategory = searchParams.get('category') || '';

  const updateParams = (updates = {}, options = {}) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    if (options.resetPage) {
      next.delete('page');
    }

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        const normalizedCategory = category || queryCategory;

        if (normalizedCategory && normalizedCategory !== 'all') {
          if (normalizedCategory === 'gift-cards') {
            params.append('category', 'GiftCard');
          } else if (normalizedCategory === 'software') {
            params.append('category', 'Software');
          } else if (normalizedCategory === 'preorder') {
            params.append('isPreOrder', 'true');
          } else {
            const platformMap = {
              pc: 'PC',
              playstation: 'PlayStation',
              xbox: 'Xbox',
              nintendo: 'Nintendo',
              steam: 'Steam',
              mobile: 'Mobile',
              itunes: 'iTunes'
            };

            if (platformMap[normalizedCategory.toLowerCase()]) {
              params.append('platform', platformMap[normalizedCategory.toLowerCase()]);
              params.append('category', 'Game');
            } else if (['Game', 'GiftCard', 'Software'].includes(normalizedCategory)) {
              params.append('category', normalizedCategory);
            }
          }
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        if (platformFilter && !category) {
          params.append('platform', platformFilter);
        }
        if (genreFilter) params.append('genre', genreFilter);
        if (priceRange) {
          const [min, max] = priceRange.split('-').map(Number);
          if (Number.isFinite(min)) params.append('minPrice', min);
          if (Number.isFinite(max)) params.append('maxPrice', max);
        }
        if (ratingFilter) params.append('rating', ratingFilter);
        if (featuredFilter) params.append('featured', featuredFilter);
        if (trendingFilter) params.append('isTrending', trendingFilter);
        if (topSellerFilter) params.append('isTopSeller', topSellerFilter);
        if (bestSellingFilter) params.append('isBestSelling', bestSellingFilter);
        if (preOrderFilter) params.append('isPreOrder', preOrderFilter);

        const response = await api.get(`/products?${params}`);
        setProducts(response.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, queryCategory, searchQuery, platformFilter, genreFilter, priceRange, ratingFilter, featuredFilter, trendingFilter, topSellerFilter, bestSellingFilter, preOrderFilter, searchParams]);

  // Handle platform change: navigate to correct route and reset filters
  const handlePlatformChange = (value) => {
    if (value) {
      navigate(`/products/${value.toLowerCase()}`);
      updateParams({
        platform: '',
        priceRange: '',
        genre: '',
        rating: ''
      }, { resetPage: true });
    }
  };

  // All filter changes except platform
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'platform') {
      handlePlatformChange(value);
      return;
    }
    updateParams({ [filterType]: value }, { resetPage: true });
  };

  const clearFilters = () => {
    updateParams({
      platform: '',
      priceRange: '',
      genre: '',
      rating: '',
      featured: '',
      isTrending: '',
      isTopSeller: '',
      isBestSelling: '',
      isPreOrder: ''
    }, { resetPage: true });
  };

  const getCategoryTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    const normalizedCategory = category || queryCategory;
    if (!normalizedCategory || normalizedCategory === 'all') return featuredFilter ? 'Featured Products' : 'All Products';

    const categoryTitles = {
      'pc': 'PC Games',
      'playstation': 'PlayStation Games',
      'xbox': 'Xbox Games',
      'nintendo': 'Nintendo Games',
      'gift-cards': 'Gift Cards & Subscriptions',
      'software': 'Software'
    };

    if (trendingFilter === 'true') return 'Trending Products';
    if (bestSellingFilter === 'true') return 'Best Selling Products';
    if (topSellerFilter === 'true') return 'Top Sellers';
    if (preOrderFilter === 'true') return 'Pre-Order Products';

    return categoryTitles[normalizedCategory] || normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1);
  };

  if (loading) {
    const ProductCardSkeleton = () => (
      <div className="product-card-skeleton">
        <div className="skeleton skeleton-image"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text-short"></div>
      </div>
    );

    return (
      <div className="products-page">
        <div className="container">
          <div className="products-header">
            <div className="products-title-section">
              <h1 className="products-title">{getCategoryTitle()}</h1>
              <p className="products-count">Loading products...</p>
            </div>
            <div className="products-controls" />
          </div>
          <div className="products-content">
            <div className="filters-sidebar">
              {/* You can also create a skeleton for filters */}
            </div>
            <div className="products-main">
              <div className="products-grid grid">
                {Array.from({ length: 12 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <SEO
        title={`Buy Game Gift Cards in Nepal | ${category ? `${category} ` : ''}Gift Cards | GamePasal`}
        description={`Browse ${category || 'PlayStation, Xbox, PC, Nintendo'} gift cards in Nepal. Instant delivery via email and account. Pay with Fonepay QR or bank transfer.`}
        keywords={`game gift cards Nepal, ${category || 'playstation,xbox,pc'} gift cards Nepal, buy digital codes Nepal`}
        canonical={`https://www.gamepasal.com/products${category ? `/${category}` : ''}`}
      />
      <div className="container">
        {/* Page Header */}
        <div className="products-header">
          <div className="products-title-section">
            <h1 className="products-title">{getCategoryTitle()}</h1>
            <p className="products-count">{products.length} products found</p>
          </div>
        </div>

        <div className="products-content">
          {/* Filters Sidebar */}
          <div className="filters-sidebar">
            <div className="filters-header">
              <h3>Filters</h3>
              <button onClick={clearFilters} className="clear-filters">
                Clear All
              </button>
            </div>

            {/* Platform Filter: Only show on "all" or "gift-cards" page */}
            {(!category || category === 'all' || category === 'gift-cards') && (
              <div className="filter-group">
                <h4>Platform</h4>
                <select
                  value={platformFilter}
                  onChange={(e) => handleFilterChange('platform', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Platforms</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation">PlayStation</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Steam">Steam</option>
                  <option value="iTunes">iTunes</option>
                </select>
              </div>
            )}

            <div className="filter-group">
              <h4>Genre</h4>
              <select
                value={genreFilter}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="filter-select"
              >
                <option value="">All Genres</option>
                <option value="Action">Action</option>
                <option value="RPG">RPG</option>
                <option value="Adventure">Adventure</option>
                <option value="Shooter">Shooter</option>
                <option value="Strategy">Strategy</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>
              <select
                value={priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="filter-select"
              >
                <option value="">Any Price</option>
                <option value="0-200">NRS 0 - 200</option>
                <option value="201-500">NRS 201 - 500</option>
                <option value="501-3000">NRS 501 - 3000</option>
                <option value="3001-999999">NRS 3001+</option>
              </select>
            </div>

            <div className="filter-group">
              <h4>Rating</h4>
              <select
                value={ratingFilter}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="filter-select"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>


          </div>

          {/* Products Grid */}
          <div className="products-main">
            {category === 'gift-cards' ? (
              <div className="giftcard-sections">
                {GIFT_CARD_PLATFORMS.map(({ key, label }) => {
                  const platformProducts = products.filter(
                    (product) =>
                      product.platform &&
                      product.platform.toLowerCase() === key.toLowerCase()
                  );
                  return (
                    <div key={key} className="giftcard-row-section">
                      <h2 className="giftcard-row-header">{label}</h2>
                      {platformProducts.length === 0 ? (
                        <p style={{ color: "#aaa", margin: "20px 0 40px" }}>No {label} found.</p>
                      ) : platformProducts.length <= 4 ? (
                        <div className="giftcard-row-list">
                          {platformProducts.map((product) => (
                            <ProductCard key={product._id} product={product} variant="simple" context="page" />
                          ))}
                        </div>
                      ) : (
                        <div className="giftcard-carousel-container">
                          <Swiper
                            modules={[Navigation, Autoplay]}
                            spaceBetween={16}
                            slidesPerView={4}
                            navigation={true}
                            autoplay={{
                              delay: 3000,
                              disableOnInteraction: false,
                            }}
                            loop={platformProducts.length > 4}
                            breakpoints={{
                              320: {
                                slidesPerView: 1,
                                spaceBetween: 16,
                              },
                              640: {
                                slidesPerView: 2,
                                spaceBetween: 16,
                              },
                              768: {
                                slidesPerView: 3,
                                spaceBetween: 16,
                              },
                              1024: {
                                slidesPerView: 4,
                                spaceBetween: 16,
                              },
                            }}
                            className="giftcard-swiper"
                          >
                            {platformProducts.map((product) => (
                              <SwiperSlide key={product._id}>
                                <ProductCard product={product} variant="simple" context="page" />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              products.length === 0 ? (
                <div className="no-products">
                  <Search size={48} />
                  <h3>No products found</h3>
                  <p>Try adjusting your filters or search terms</p>
                  <button onClick={clearFilters} className="btn btn-primary">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="products-grid grid">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} variant="simple" context="page" />
                  ))}
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Products;
