import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import './Cart.css';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBag size={80} />
            </div>
            <h2>Your Cart is Currently Empty</h2>
            <p>But it doesn't have to be. Browse our amazing collection of games, gift cards, and software to find your next adventure!</p>
            <div className="empty-cart-actions">
              <Link to="/" className="btn btn-secondary">
                Back to Homepage
              </Link>
              <Link to="/products" className="btn btn-primary">
                Explore All Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <Link to="/products" className="back-link">
            <ArrowLeft size={20} />
            Continue Shopping
          </Link>
          <h1>Shopping Cart</h1>
          <button onClick={clearCart} className="clear-cart">
            Clear Cart
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="item-image">
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
                </div>
                
                <div className="item-details">
                  <h3 className="item-title">{item.title}</h3>
                  {item.platform && (
                    <span className="item-platform">{item.platform}</span>
                  )}
                  <div className="item-price">
                    {item.salePrice ? (
                      <>
                        <span className="current-price">NRS {item.salePrice}</span>
                        <span className="original-price">NRS {item.price}</span>
                      </>
                    ) : (
                      <span className="current-price">NRS {item.price}</span>
                    )}
                  </div>
                </div>

                <div className="item-quantity">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="item-total">
                  NRS {((item.salePrice || item.price) * item.quantity).toFixed(2)}
                </div>

                <button 
                  className="remove-item"
                  onClick={() => removeFromCart(item._id)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>NRS {getCartTotal().toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Tax</span>
                <span>NRS 0.00</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free">Free</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Total</span>
                <span>NRS {getCartTotal().toFixed(2)}</span>
              </div>

              <button 
                className="btn btn-primary checkout-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </button>

              <div className="payment-methods">
                <p>We accept:</p>
                <div className="payment-icons">
                  <span className="payment-icon">eSewa</span>
                  <span className="payment-icon">Khalti</span>
                  <span className="payment-icon">Bank Transfer</span>
                </div>
              </div>
            </div>

            <div className="promo-code">
              <h4>Have a promo code?</h4>
              <div className="promo-input-group">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  className="promo-input"
                />
                <button className="btn btn-secondary">Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;