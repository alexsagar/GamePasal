import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, Search, Grid, List } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import api from '../../services/api'; // Make sure you import your API utility
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import './Products.css';

const Products = () => {
  const { category } = useParams(); // e.g., 'pc', 'playstation', etc.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    platform: '',
    priceRange: '',
    genre: '',
    rating: '',
    sortBy: 'newest'
  });

  const GIFT_CARD_PLATFORMS = [
  { key: 'Steam', label: 'Steam Gift Cards' },
  { key: 'PlayStation', label: 'PlayStation Gift Cards' },
  { key: 'Xbox', label: 'Xbox Gift Cards' },
  { key: 'iTunes', label: 'iTunes Gift Cards' },
];


  // Keep sidebar filter state in sync with URL category for platform pages
  useEffect(() => {
    if (
      category &&
      ['pc', 'playstation', 'xbox', 'steam', 'gift-cards'].includes(category)
    ) {
      // Don't allow sidebar platform filter on platform-specific pages
      setFilters((prev) => ({ ...prev, platform: '' }));
    }
  }, [category]);

  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        // Category/Platform from URL
        if (category && category !== 'all') {
          if (category === 'gift-cards') {
            params.append('category', 'GiftCard');
          } else if (category === 'software') {
            params.append('category', 'Software');
          } else {
            // It's a platform like 'pc', 'playstation', etc.
            params.append('platform', category.charAt(0).toUpperCase() + category.slice(1));
          }
        }

        // Search
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        // Other filters
        if (filters.platform) {
          params.append('platform', filters.platform);
        }

        if (filters.genre) params.append('genre', filters.genre);
        if (filters.priceRange) {
          const [min, max] = filters.priceRange.split('-').map(Number);
          params.append('minPrice', min);
          params.append('maxPrice', max);
        }
        if (filters.rating) params.append('rating', filters.rating);
        if (filters.sortBy) {
          params.append('sort', filters.sortBy);
        }

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
  }, [category, searchQuery, filters]);

  // Handle platform change: navigate to correct route and reset filters
  const handlePlatformChange = (value) => {
    if (value) {
      navigate(`/products/${value.toLowerCase()}`);
      // Optionally reset filters except sort (to mimic most stores)
      setFilters({
        platform: '',
        priceRange: '',
        genre: '',
        rating: '',
        sortBy: filters.sortBy
      });
    }
  };

  // All filter changes except platform
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'platform') {
      handlePlatformChange(value);
      return;
    }
    setFilters((prev) => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      platform: '',
      priceRange: '',
      genre: '',
      rating: '',
      sortBy: 'newest'
    });
  };

  const getCategoryTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (!category || category === 'all') return 'All Products';

    const categoryTitles = {
      'pc': 'PC Games',
      'playstation': 'PlayStation Games',
      'xbox': 'Xbox Games',
      'nintendo': 'Nintendo Games',
      'gift-cards': 'Gift Cards & Subscriptions',
      'software': 'Software'
    };

    return categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1);
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
            <div className="products-controls">
              <div className="view-controls">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}><Grid size={20} /></button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}><List size={20} /></button>
              </div>
            </div>
          </div>
          <div className="products-content">
            <div className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
              {/* You can also create a skeleton for filters */}
            </div>
            <div className="products-main">
              <div className={`products-grid ${viewMode}`}>
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
        description={`Browse ${category || 'PlayStation, Xbox, PC, Nintendo'} gift cards in Nepal. Instant delivery via email and account. Pay with eSewa, Khalti, or bank transfer.`}
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

          <div className="products-controls">
            {/* <button
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              Filters
            </button> */}

            <div className="view-controls">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="products-content">
          {/* Filters Sidebar */}
          <div className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
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
                  value={filters.platform}
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
                value={filters.genre}
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
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="filter-select"
              >
                <option value="">Any Price</option>
                <option value="0-20">100 - 200</option>
                <option value="20-40">200 - 500</option>
                <option value="40-60">500 - 3000</option>
                <option value="60-100">3000+</option>
              </select>
            </div>

            <div className="filter-group">
              <h4>Rating</h4>
              <select
                value={filters.rating}
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

            <div className="filter-group">
              <h4>Sort By</h4>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
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
      <div className={`products-grid ${viewMode}`}>
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