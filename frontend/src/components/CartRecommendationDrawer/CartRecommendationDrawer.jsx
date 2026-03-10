import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import './CartRecommendationDrawer.css';

const RAW_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ROOT = (RAW_ROOT || '').replace(/\/$/, '');

const getImageSrc = (img) =>
  img
    ? img.startsWith('http')
      ? img
      : `${ROOT}/uploads/${img}`
    : '';

const CartRecommendationDrawer = () => {
  const navigate = useNavigate();
  const { recommendationEvent, clearRecommendationEvent } = useCart();
  const [products, setProducts] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    let timeoutId;

    const fetchRecommendations = async () => {
      if (!recommendationEvent?.productId) {
        setVisible(false);
        setProducts([]);
        return;
      }

      try {
        const response = await api.get(`/products/${recommendationEvent.productId}/recommendations?limit=4`);
        if (!active) return;

        const nextProducts = response.data.data || [];
        setProducts(nextProducts);
        setVisible(nextProducts.length > 0);

        timeoutId = setTimeout(() => {
          if (active) {
            setVisible(false);
          }
        }, 9000);
      } catch (error) {
        if (active) {
          setProducts([]);
          setVisible(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [recommendationEvent]);

  if (!visible || !products.length) {
    return null;
  }

  return (
    <aside className="cart-recommendation-drawer" aria-live="polite">
      <div className="drawer-header">
        <div>
          <p className="drawer-eyebrow">Added to cart</p>
          <h3>You may also like</h3>
        </div>
        <button
          type="button"
          className="drawer-close"
          onClick={() => {
            setVisible(false);
            clearRecommendationEvent();
          }}
          aria-label="Close recommendations"
        >
          <X size={18} />
        </button>
      </div>

      <p className="drawer-copy">
        {recommendationEvent?.title ? `Products similar to ${recommendationEvent.title}` : 'Similar products'}
      </p>

      <div className="drawer-products">
        {products.map((product) => (
          <button
            key={product._id}
            type="button"
            className="drawer-product"
            onClick={() => {
              setVisible(false);
              navigate(`/product/${product._id}`);
            }}
          >
            <img src={getImageSrc(product.image)} alt={product.title} />
            <div className="drawer-product-info">
              <span className="drawer-product-title">{product.title}</span>
              <span className="drawer-product-meta">
                {product.category}{product.platform ? ` · ${product.platform}` : ''}
              </span>
              <span className="drawer-product-price">NRS {product.salePrice || product.price}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="drawer-actions">
        <button
          type="button"
          className="drawer-cart-btn"
          onClick={() => {
            setVisible(false);
            navigate('/cart');
          }}
        >
          <ShoppingBag size={16} />
          View Cart
        </button>
      </div>
    </aside>
  );
};

export default CartRecommendationDrawer;
