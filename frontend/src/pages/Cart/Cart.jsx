import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import CartItemRow from '../../components/Cart/CartItemRow';
import MoneyRow from '../../components/Cart/MoneyRow';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './Cart.css';

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    savePendingCheckout,
    getCartTotal
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleMoveToWishlist = (productId) => {
    // TODO: Implement wishlist functionality
    toast.success('Item moved to wishlist');
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    // TODO: Implement promo code validation
    toast.error('Invalid promo code');
  };

  const handleCheckout = async () => {
    if (isAuthenticated) {
      navigate('/checkout/review');
    } else if (showGuestCheckout && guestEmail) {
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      // For guests, create order and proceed to payment
      const orderData = {
        products: cartItems.map(item => ({
          productId: item._id,
          quantity: item.quantity
        })),
        totalAmount: total / 100, // Convert to NPR from paisa
        paymentMethod: 'Pending',
        shippingAddress: null,
        guestEmail
      };

      try {

        const response = await api.post('/orders', orderData);
        const order = response.data.data || response.data;
        const createdOrderId = order._id || order.orderId;

        savePendingCheckout(createdOrderId, cartItems);
        navigate('/checkout/payment', {
          state: {
            orderId: createdOrderId,
            total: orderData.totalAmount,
            guestEmail,
            isGuest: true
          }
        });
      } catch (error) {
        console.error('Error creating order:', error);
        console.log('Error response:', error.response?.data);
        console.log('Order data sent:', orderData);

        let errorMessage = 'Failed to create order. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
        }

        toast.error(errorMessage);
      }
    } else {
      setShowGuestCheckout(true);
    }
  };

  // Calculate order summary in NPR (stored as paisa)
  const subtotal = getCartTotal() * 100;
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-wrapper">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingBag size={48} />
            </div>
            <h2 className="cart-empty-title">
              Your cart is empty
            </h2>
            <p className="cart-empty-text">
              Browse our amazing collection of games, gift cards, and software to find your next adventure!
            </p>
            <div className="cart-empty-buttons">
              <Link to="/" className="cart-button cart-button-secondary">
                <ArrowLeft size={20} className="mr-2" />
                Back to Homepage
              </Link>
              <Link to="/products" className="cart-button cart-button-primary">
                Browse Games
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-wrapper">
        {/* Header */}
        <div className="cart-header">
          <Link to="/products" className="cart-header-back">
            <ArrowLeft size={20} className="mr-2" />
            Continue Shopping
          </Link>
          <h1 className="cart-header-title">Shopping Cart</h1>
          <button onClick={clearCart} className="cart-clear">
            Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <CartItemRow
                key={item._id}
                item={{
                  _id: item._id,
                  title: item.title,
                  platform: item.platform,
                  priceNpr: (item.salePrice || item.price) * 100, // Convert to paisa
                  qty: item.quantity,
                  image: item.image
                }}
                onQuantityChange={handleQuantityChange}
                onRemove={removeFromCart}
                onMoveToWishlist={handleMoveToWishlist}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <h3 className="cart-summary-title">Order Summary</h3>

            <div className="cart-summary-content">
              <MoneyRow
                label={`Subtotal (${cartItems.length} items)`}
                amount={subtotal}
              />
              <MoneyRow
                label="Shipping"
                amount={shipping}
              />
              <MoneyRow
                label="Total"
                amount={total}
                isTotal={true}
              />
            </div>

            {!isAuthenticated && showGuestCheckout ? (
              <div className="cart-guest-checkout">
                <div className="cart-guest-input">
                  <input
                    type="email"
                    placeholder="Enter your email to continue"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="cart-input"
                  />
                </div>
                <p className="cart-guest-note">
                  Your order details will be sent to this email
                </p>
              </div>
            ) : null}

            <button
              onClick={handleCheckout}
              className="cart-checkout-button"
              disabled={!isAuthenticated && showGuestCheckout && !guestEmail}
            >
              {!isAuthenticated && !showGuestCheckout
                ? 'Checkout as Guest'
                : 'Proceed to Checkout'
              }
            </button>

            {!isAuthenticated && showGuestCheckout && (
              <button
                onClick={() => navigate('/login')}
                className="cart-login-button"
              >
                Login Instead
              </button>
            )}

            {/* Promo Code */}
            <div className="cart-promo">
              <div className="cart-promo-label">
                <Tag size={16} />
                <h4>Have a promo code?</h4>
              </div>
              <div className="cart-promo-input">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                />
                <button onClick={handleApplyPromo} className="cart-promo-button">
                  Apply
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="cart-payment-methods">
              <p className="cart-payment-label">We accept:</p>
              <div className="cart-payment-options">
                <span className="cart-payment-badge esewa">
                  eSewa
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
