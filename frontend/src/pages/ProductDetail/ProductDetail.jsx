import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Heart,
  Share2,
  Monitor,
  Calendar,
  Users,
  Award,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import ProductRecommendations from '../../components/ProductRecommendations/ProductRecommendations';
import './ProductDetail.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


// --- Universal Image Helper ---
const RAW_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ROOT = (RAW_ROOT || '').replace(/\/$/, '');
const getImageSrc = (img) =>
  img
    ? img.startsWith('http')
      ? img
      : `${ROOT}/uploads/${img}`
    : '';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data);
      fetchRelatedProducts(response.data.data._id);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProductId) => {
    try {
      const response = await api.get(`/products/${currentProductId}/recommendations?limit=8`);
      setRelatedProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    }
  };


  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error-state">
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountPercentage = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  const parsedStock = Number(product?.stock);
  const stockValue = Number.isFinite(parsedStock) ? parsedStock : 0;

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  return (
    <div className="product-detail-page">
      <SEO
        title={`Buy ${product?.title || 'Product'} in Nepal | Instant Code | GamePasal`}
        description={`${product?.title || 'Digital product'} – instant delivery in Nepal. Pay with Fonepay QR or bank transfer at GamePasal.`}
        keywords={`game gift cards Nepal, buy ${product?.platform || ''} gift cards, ${product?.title || ''}, digital code Nepal`}
        canonical={`https://www.gamepasal.com/product/${product?.slug || id}`}
        jsonLd={product ? ({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          description: product.description || `${product.title} digital code for Nepal.`,
          image: [product.image],
          sku: product.sku || product._id,
          brand: { '@type': 'Brand', name: product.platform || 'Game' },
          aggregateRating: product.rating ? {
            '@type': 'AggregateRating',
            ratingValue: String(product.rating || 4.8),
            reviewCount: String(product.reviewCount || 10)
          } : undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'NPR',
            price: String(product.salePrice || product.price),
            availability: stockValue > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://www.gamepasal.com/product/${product.slug || id}`
          }
        }) : null}
      />
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="gp-breadcrumb">
          <ul className="gp-breadcrumb-list">
            <li className="gp-breadcrumb-item gp-breadcrumb-chip">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 511 511.999"><path d="M498.7 222.695c-.016-.011-.028-.027-.04-.039L289.805 13.81C280.902 4.902 269.066 0 256.477 0c-12.59 0-24.426 4.902-33.332 13.809L14.398 222.55c-.07.07-.144.144-.21.215-18.282 18.386-18.25 48.218.09 66.558 8.378 8.383 19.44 13.235 31.273 13.746.484.047.969.07 1.457.07h8.32v153.696c0 30.418 24.75 55.164 55.168 55.164h81.711c8.285 0 15-6.719 15-15V376.5c0-13.879 11.293-25.168 25.172-25.168h48.195c13.88 0 25.168 11.29 25.168 25.168V497c0 8.281 6.715 15 15 15h81.711c30.422 0 55.168-24.746 55.168-55.164V303.14h7.719c12.586 0 24.422-4.903 33.332-13.813 18.36-18.367 18.367-48.254.027-66.633zm-21.243 45.422a17.03 17.03 0 0 1-12.117 5.024h-22.72c-8.285 0-15 6.714-15 15v168.695c0 13.875-11.289 25.164-25.168 25.164h-66.71V376.5c0-30.418-24.747-55.168-55.169-55.168H232.38c-30.422 0-55.172 24.75-55.172 55.168V482h-66.71c-13.876 0-25.169-11.29-25.169-25.164V288.14c0-8.286-6.715-15-15-15H48a13.9 13.9 0 0 0-.703-.032c-4.469-.078-8.66-1.851-11.8-4.996-6.68-6.68-6.68-17.55 0-24.234.003 0 .003-.004.007-.008l.012-.012L244.363 35.02A17.003 17.003 0 0 1 256.477 30c4.574 0 8.875 1.781 12.113 5.02l208.8 208.796.098.094c6.645 6.692 6.633 17.54-.031 24.207zm0 0"/></svg>
              <button onClick={() => navigate('/')} className="label">Home</button>
            </li>
            <li className="gp-breadcrumb-sep">/</li>
            <li className="gp-breadcrumb-item gp-breadcrumb-chip">
              <Monitor size={16} style={{ marginRight: 8 }} />
              <button onClick={() => navigate(`/products?category=${encodeURIComponent(product.platform || 'All')}`)} className="label">
                {product.platform || 'Products'}
              </button>
            </li>
            <li className="gp-breadcrumb-sep">/</li>
            <li className="gp-breadcrumb-item gp-breadcrumb-chip active">
              <span className="label">{product.title}</span>
            </li>
          </ul>
        </nav>

        {/* Product Bento Layout */}
        <div className="product-bento-grid">
          {/* Main Product Image - Large */}
          <div className="bento-card product-image-main">
            <div className="main-image-container">
              <img 
                src={getImageSrc(images[selectedImage])} 
                alt={product.title}
                loading="lazy" decoding="async"
                className="main-product-image"
              />
              {product.badge && (
                <span className={`product-badge badge-${product.badge.toLowerCase()}`}>
                  {product.badge}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="discount-badge">
                  -{discountPercentage}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={getImageSrc(image)} alt={`${product.title} ${index + 1}`} loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Title & Meta - Compact */}
          <div className="bento-card product-title-card">
            <div className="product-meta">
              <span className="product-platform">{product.platform}</span>
              {product.genre && (
                <span className="product-genre">{product.genre}</span>
              )}
            </div>
            <h1 className="product-title">{product.title}</h1>
            {product.rating && (
              <div className="product-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < Math.floor(product.rating) ? "#ffd700" : "none"}
                      color="#ffd700"
                    />
                  ))}
                </div>
                <span className="rating-text">
                  {product.rating} ({product.reviewCount || 0})
                </span>
              </div>
            )}
          </div>

          {/* Pricing & Purchase - Compact */}
          <div className="bento-card product-purchase-card">
            <div className="product-pricing">
              {product.salePrice ? (
                <div className="price-group">
                  <span className="current-price">NRS {product.salePrice}</span>
                  <span className="original-price">NRS {product.price}</span>
                </div>
              ) : (
                <span className="current-price">NRS {product.price}</span>
              )}
            </div>
            
            <div className="stock-info">
              {stockValue > 0 ? (
                <span className="in-stock">
                  <CheckCircle size={14} />
                  In Stock ({stockValue})
                </span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="quantity-selector">
              <label>Qty:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= stockValue}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-compact"
                onClick={handleBuyNow}
                disabled={stockValue === 0}
              >
                <ShoppingCart size={16} />
                Buy Now
              </button>
              
              <button 
                className={`btn btn-secondary btn-compact ${isInCart(product._id) ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={stockValue === 0 || isInCart(product._id)}
              >
                {isInCart(product._id) ? 'Added' : 'Add to Cart'}
              </button>
            </div>
          </div>

          {/* Description - Compact */}
          <div className="bento-card product-description-card">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* Features - Compact */}
          {product.features && product.features.length > 0 && (
            <div className="bento-card product-features-card">
              <h3>Key Features</h3>
              <ul>
                {product.features.slice(0, 5).map((feature, index) => (
                  <li key={index}>
                    <CheckCircle size={12} />
                    {feature}
                  </li>
                ))}
                {product.features.length > 5 && (
                  <li className="more-features">+{product.features.length - 5} more features</li>
                )}
              </ul>
            </div>
          )}

          {/* Product Details - Compact Grid */}
          <div className="bento-card product-details-card">
            <h3>Product Details</h3>
            <div className="details-compact">
              {product.developer && (
                <div className="detail-compact">
                  <Users size={14} />
                  <span>{product.developer}</span>
                </div>
              )}
              {product.publisher && (
                <div className="detail-compact">
                  <Award size={14} />
                  <span>{product.publisher}</span>
                </div>
              )}
              {product.releaseDate && (
                <div className="detail-compact">
                  <Calendar size={14} />
                  <span>{new Date(product.releaseDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="detail-compact">
                <Monitor size={14} />
                <span>{product.platform}</span>
              </div>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="bento-card product-actions-card">
            <div className="secondary-actions">
              <button className="action-btn">
                <Heart size={16} />
                Wishlist
              </button>
              <button className="action-btn">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        {product.systemRequirements && (
          <div className="system-requirements">
            <h2>System Requirements</h2>
            <div className="requirements-grid">
              {product.systemRequirements.minimum && (
                <div className="requirement-section">
                  <h3>Minimum Requirements</h3>
                  <pre>{product.systemRequirements.minimum}</pre>
                </div>
              )}
              {product.systemRequirements.recommended && (
                <div className="requirement-section">
                  <h3>Recommended Requirements</h3>
                  <pre>{product.systemRequirements.recommended}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        <ProductRecommendations title="Recommended for You" products={relatedProducts} />

      </div>
    </div>
  );
};

export default ProductDetail;
