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
import './ProductDetail.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';


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
      // Fetch related products
      if (response.data.data.platform) {
        fetchRelatedProducts(response.data.data.platform, response.data.data._id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (platform, currentProductId) => {
  try {
    const response = await api.get(`/products?platform=${platform}`); // No limit param
    // Filter out only the current product
    const filtered = response.data.data.filter(p => p._id !== currentProductId);
    setRelatedProducts(filtered); // No .slice()
  } catch (error) {
    console.error('Error fetching related products:', error);
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

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  return (
    <div className="product-detail-page">
      <SEO
        title={`Buy ${product?.title || 'Product'} in Nepal | Instant Code | GamePasal`}
        description={`${product?.title || 'Digital product'} – instant delivery in Nepal. Pay with eSewa, Khalti, or bank transfer at GamePasal.`}
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
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://www.gamepasal.com/product/${product.slug || id}`
          }
        }) : null}
      />
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <span className="breadcrumb-path">
            Products / {product.platform} / {product.title}
          </span>
        </div>

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
              {product.stock > 0 ? (
                <span className="in-stock">
                  <CheckCircle size={14} />
                  In Stock ({product.stock})
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
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-compact"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                <ShoppingCart size={16} />
                Buy Now
              </button>
              
              <button 
                className={`btn btn-secondary btn-compact ${isInCart(product._id) ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isInCart(product._id)}
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
  <div className="related-products">
    <h2>Related Products</h2>
    <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={24}
      slidesPerView={3}
      
      pagination={{ clickable: true }}
      breakpoints={{
        1024: { slidesPerView: 3 },
        768: { slidesPerView: 2 },
        480: { slidesPerView: 1 }
      }}
      style={{ padding: "10px 0 30px 0" }}
    >
      {relatedProducts.map((relatedProduct) => (
        <SwiperSlide key={relatedProduct._id}>
          <div
            className="related-product-card"
            onClick={() => navigate(`/product/${relatedProduct._id}`)}
          >
            <img src={getImageSrc(relatedProduct.image)} alt={relatedProduct.title} loading="lazy" decoding="async" />
            <div className="related-product-info">
              <h4>{relatedProduct.title}</h4>
              <div className="related-product-price1">
                {relatedProduct.salePrice ? (
                  <>
                    <span className="current">NRS {relatedProduct.salePrice}</span>
                    <span className="original">NRS {relatedProduct.price}</span>
                  </>
                ) : (
                  <span className="current">NRS {relatedProduct.price}</span>
                )}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)}

      </div>
    </div>
  );
};

export default ProductDetail;
