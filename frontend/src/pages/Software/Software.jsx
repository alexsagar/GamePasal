import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Monitor, Filter, Grid, List, Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import api from '../../services/api';
import './Software.css';

const Software = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  useEffect(() => {
    fetchSoftware();
  }, [currentPage, sortBy, searchTerm, priceRange]);

  const fetchSoftware = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'Software',
        page: currentPage,
        limit: productsPerPage,
        sort: getSortField(sortBy),
        order: getSortOrder(sortBy)
      });

      if (searchTerm) params.append('search', searchTerm);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);

      const response = await api.get(`/products?${params}`);
      setSoftware(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalProducts(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching software:', error);
      setSoftware([]);
    } finally {
      setLoading(false);
    }
  };

  const getSortField = (sortBy) => {
    switch (sortBy) {
      case 'price-low': return 'price';
      case 'price-high': return 'price';
      case 'name': return 'name';
      case 'newest': return 'createdAt';
      default: return 'createdAt';
    }
  };

  const getSortOrder = (sortBy) => {
    switch (sortBy) {
      case 'price-low': return 'asc';
      case 'price-high': return 'desc';
      case 'name': return 'asc';
      case 'newest': return 'desc';
      default: return 'desc';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSoftware();
  };

  const handlePriceFilter = () => {
    setCurrentPage(1);
    fetchSoftware();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="software-page">
      <div className="container">
        {/* Header */}
        <div className="software-header">
          <div className="software-title-section">
            <div className="software-title-with-icon">
              <Monitor className="software-page-icon" />
              <div>
                <h1 className="software-page-title">Software</h1>
                <p className="software-page-subtitle">
                  Discover professional software and applications
                </p>
              </div>
            </div>
          </div>
          
          <div className="software-stats">
            <span className="software-count">
              {totalProducts} {totalProducts === 1 ? 'Software' : 'Software Products'}
            </span>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="software-controls">
          <div className="software-controls-left">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
            
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search software..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button type="submit" className="search-btn">Search</button>
            </form>
          </div>

          <div className="software-controls-right">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            <div className="view-mode-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-section">
              <h4>Price Range</h4>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="price-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="price-input"
                />
                <button onClick={handlePriceFilter} className="apply-filter-btn">
                  Apply
                </button>
              </div>
            </div>
            
            <div className="filter-actions">
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Software Grid/List */}
        <div className="software-content">
          {loading ? (
            <div className="software-loading">
              <div className="loading-spinner"></div>
              <p>Loading software...</p>
            </div>
          ) : software.length > 0 ? (
            <>
              <div className={`software-grid ${viewMode}`}>
                {software.map((product) => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    variant={viewMode === 'list' ? 'list' : 'simple'}
                    context={viewMode === 'list' ? undefined : 'page'}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-software">
              <Monitor size={64} className="no-software-icon" />
              <h3>No Software Found</h3>
              <p>
                {searchTerm || priceRange.min || priceRange.max
                  ? "No software matches your current filters. Try adjusting your search criteria."
                  : "No software products are currently available. Check back later!"}
              </p>
              {(searchTerm || priceRange.min || priceRange.max) && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Software;