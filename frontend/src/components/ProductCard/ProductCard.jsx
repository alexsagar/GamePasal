import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Star } from 'lucide-react';
import './ProductCard.css';

const RAW_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ROOT = (RAW_ROOT || '').replace(/\/$/, '');

// Helper to handle image src logic
const getImageSrc = (img) =>
  img
    ? img.startsWith('http')
      ? img
      : `${ROOT}/uploads/${img}`
    : '';

const ProductCard = ({ product, featured = false, variant = "default", context = 'page' }) => {
  const { addToCart, updateQuantity, removeFromCart, isInCart, getCartItem } = useCart();
  const navigate = useNavigate();
  const [showAddedToast, setShowAddedToast] = useState(false);

  const inCart = isInCart(product._id);
  const cartItem = getCartItem(product._id);
  const currentQty = cartItem?.quantity || 0;
  const maxStock = typeof product.stock === 'number' ? product.stock : Infinity;
  const isOutOfStock = maxStock === 0;

  const handleNavigate = () => {
    navigate(`/product/${product._id}`);
  };

  const handleAdd = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 1200);
  };

  const handleDecrease = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!inCart) return;
    if (currentQty <= 1) {
      removeFromCart(product._id);
      return;
    }
    updateQuantity(product._id, currentQty - 1);
  };

  const handleIncrease = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!inCart) return;
    if (currentQty >= maxStock) return;
    updateQuantity(product._id, currentQty + 1);
  };

  const ActionArea = ({ simple = false }) => {
    if (isOutOfStock) {
      return (
        <div className={simple ? `action-area-compact ${context}` : 'action-area'}>
          <button className={simple ? `out-of-stock-compact ${context}` : 'out-of-stock'} disabled aria-disabled="true">
            Out of Stock
          </button>
        </div>
      );
    }

    if (!inCart) {
      return (
        <div className={simple ? `action-area-compact ${context}` : 'action-area'}>
          <button
            className={simple ? `add-btn-compact ${context}` : 'add-btn'}
            onClick={handleAdd}
            aria-label="Add to cart"
            onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ handleAdd(e);} }}
          >
            Add to Cart
          </button>
          {showAddedToast && (
            <div className="added-toast" role="status">Added</div>
          )}
        </div>
      );
    }

    const disablePlus = currentQty >= maxStock;

    return (
      <div className={simple ? `action-area-compact ${context}` : 'action-area'}>
        <div className={simple ? `qty-stepper-compact ${context}` : 'qty-stepper'} role="group" aria-label="Quantity">
          <button
            className={simple ? `qty-btn-compact ${context}` : 'qty-btn'}
            onClick={handleDecrease}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <div className="qty-value-compact" aria-live="polite" aria-atomic="true">{currentQty}</div>
          <button
            className={simple ? `qty-btn-compact ${context}` : 'qty-btn'}
            onClick={handleIncrease}
            disabled={disablePlus}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  // --- Simple (homepage, grids) ---
  if (variant === 'simple') {
    const discountPercentage = product.salePrice 
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

    return (
      <div className={`product-card-compact ${context}`} onClick={handleNavigate} style={{ cursor: 'pointer' }}>
        <div className="product-image-wrapper">
          <img 
            src={getImageSrc(product.image)} 
            alt={product.title} 
            loading="lazy" 
            className="product-image-compact"
          />
          {product.badge && (
            <span className={`product-badge-compact badge-${product.badge.toLowerCase()}`}>
              {product.badge}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="discount-badge-compact">
              -{discountPercentage}%
            </span>
          )}
        </div>
        
        <div className="product-content-compact">
          <div className="product-meta-compact">
            {product.platform && (
              <span className="platform-tag">{product.platform}</span>
            )}
            {product.rating && (
              <div className="rating-compact">
                <Star size={10} fill="#ffd700" color="#ffd700" />
                <span>{product.rating}</span>
              </div>
            )}
          </div>
          
          <h3 className="product-title-compact">{product.title}</h3>
          
          <div className="product-price-compact">
            <span className="current-price-compact">
              NRS {product.salePrice ? product.salePrice : product.price}
            </span>
            {product.salePrice && (
              <span className="original-price-compact">NRS {product.price}</span>
            )}
          </div>
          
          <ActionArea simple />
        </div>
      </div>
    );
  }

  // --- Default / List variants ---
  const isList = variant === 'list';
  return (
    <div className={`product-card ${featured ? 'featured' : ''} ${isList ? 'list' : ''}`} onClick={handleNavigate} role="button" tabIndex={0}>
      <div className="product-image-container">
        <img src={getImageSrc(product.image)} alt={product.title} loading="lazy" className="product-image" />
      </div>
      <div className="product-info">
        {product.platform && <span className="product-platform">{product.platform}</span>}
        <h3 className="product-title1">{product.title}</h3>
        {product.description && (
          <p className="product-description1">
            {product.description.length > 70 ? product.description.slice(0, 70) + '...' : product.description}
          </p>
        )}
        {product.rating && (
          <div className="product-rating">
            <Star size={14} fill="#ffd700" color="#ffd700" />
            <span>{product.rating}</span>
          </div>
        )}
        <div className="product-price">
          {product.salePrice ? (
            <>
              <span className="current-price">NRS {product.salePrice}</span>
              <span className="original-price">NRS {product.price}</span>
            </>
          ) : (
            <span className="current-price">NRS {product.price}</span>
          )}
        </div>
        <ActionArea />
      </div>
    </div>
  );
};

export default ProductCard;