import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Monitor, Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import api from '../../services/api';
import './Software.css';

const Software = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  const currentPage = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const searchTerm = searchParams.get('search') || '';
  const priceRange = {
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  };

  const updateParams = (updates = {}) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    if (!('page' in updates)) {
      next.set('page', '1');
    }

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    fetchSoftware();
  }, [currentPage, searchTerm, priceRange.min, priceRange.max]);

  const fetchSoftware = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'Software',
        page: String(currentPage),
        limit: productsPerPage
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

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchTerm, page: '1' });
  };

  const handlePriceFilter = () => {
    updateParams({
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      page: '1'
    });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams({ page: '1' }), { replace: true });
  };

  const handlePageChange = (page) => {
    updateParams({ page: String(page) });
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
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search software..."
                  value={searchTerm}
                  onChange={(e) => updateParams({ search: e.target.value })}
                  className="search-input"
                />
              </div>
              <button type="submit" className="search-btn">Search</button>
            </form>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="advanced-filters">
          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => updateParams({ minPrice: e.target.value })}
                className="price-input"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => updateParams({ maxPrice: e.target.value })}
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

        {/* Software Grid/List */}
        <div className="software-content">
          {loading ? (
            <div className="software-loading">
              <div className="loading-spinner"></div>
              <p>Loading software...</p>
            </div>
          ) : software.length > 0 ? (
            <>
              <div className="software-grid grid">
                {software.map((product) => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    variant="simple"
                    context="page"
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
