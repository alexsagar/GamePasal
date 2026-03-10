import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, Truck, Mail } from 'lucide-react';
import MoneyRow from '../../components/Cart/MoneyRow';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Review.css';

/**
 * Review Page Component
 * Final review before placing order and proceeding to payment
 */
const Review = () => {
  const { cartItems, getCartTotal, savePendingCheckout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const isGuest = !user;

  const subtotal = getCartTotal() * 100; // Convert to paisa
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;

    // Validate cart items
    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate user or guest email
    if (!user && !guestEmail) {
      toast.error('Please enter your email address to continue');
      return;
    }

    // Validate guest email format
    if (isGuest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate products in cart
    const hasInvalidItems = cartItems.some(item => !item._id || !item.quantity);
    if (hasInvalidItems) {
      toast.error('Some items in your cart are invalid');
      navigate('/cart');
      return;
    }

    // Validate total amount
    if (total <= 0) {
      toast.error('Invalid order amount');
      return;
    }
    
    setIsPlacingOrder(true);
    
    const orderData = {
      products: cartItems.map(item => ({
        productId: item._id,
        quantity: item.quantity
      })),
      totalAmount: total / 100, // Convert back to NPR
      paymentMethod: 'Pending',
      shippingAddress: null, // Digital delivery
      ...(isGuest && { guestEmail: guestEmail })
    };

    try {

      const response = await api.post('/orders', orderData);
      const order = response.data.data || response.data;
      const createdOrderId = order._id || order.orderId;
      
      savePendingCheckout(createdOrderId, cartItems);
      
      // Show success message
      toast.success('Order placed! Proceeding to payment...');
      
      // Navigate to payment method selection
      navigate('/checkout/payment', { 
        state: { 
          orderId: createdOrderId,
          total: orderData.totalAmount,
          isGuest: false
        } 
      });
    } catch (error) {
      console.error('Error placing order:', error);
      console.log('Error response:', error.response?.data);
      console.log('Order data sent:', orderData);
      
      let errorMessage = 'Failed to place order. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleBack = () => {
    navigate('/cart');
  };

  // Mask email for privacy
  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="review-container">
      <div className="review-wrapper">
        {/* Header */}
        <div className="review-header">
          <button 
            onClick={handleBack}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Back to Cart
          </button>
          <h1 className="review-title">Review Your Order</h1>
        </div>

        <div className="review-layout">
          {/* Main Content */}
          <div className="review-form">
            {/* Customer Information */}
            <div className="review-section">
              <h2 className="section-header">
                <CheckCircle size={20} className="text-success" />
                <span className="section-title">Customer Information</span>
              </h2>
              <div className="customer-info-grid">
                {isGuest ? (
                  <div className="guest-email-container">
                    <label className="info-label" htmlFor="guestEmail">
                      Email Address *
                    </label>
                    <div className="guest-email-input">
                      <Mail size={16} />
                      <input
                        id="guestEmail"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="review-input"
                        required
                      />
                    </div>
                    <p className="guest-email-note">
                      * Your order details and digital items will be sent to this email
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="info-label">
                        Full Name
                      </label>
                      <p className="info-value">{user?.username || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="info-label">
                        Email Address
                      </label>
                      <p className="email-value">
                        <Mail size={16} />
                        {maskEmail(user?.email)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="review-section">
              <h2 className="section-header">
                <Truck size={20} className="text-info" />
                <span className="section-title">Delivery Method</span>
              </h2>
              <div className="delivery-alert">
                <div className="delivery-alert-dot"></div>
                <div>
                  <p className="delivery-alert-title">Digital Delivery</p>
                  <p className="delivery-alert-text">
                    Your digital products will be delivered to your email address within 24 hours after payment confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="review-section">
              <h2 className="section-title">
                Order Items ({cartItems.length})
              </h2>
              <div className="order-items">
                {cartItems.map((item) => (
                  <div key={item._id} className="order-item">
                    <img
                      src={item.image || '/placeholder-game.jpg'}
                      alt={item.title}
                      className="item-image"
                      onError={(e) => {
                        e.target.src = '/placeholder-game.jpg';
                      }}
                    />
                    <div className="item-details">
                      <h3 className="item-title">
                        {item.title}
                      </h3>
                      <p className="item-meta">
                        {item.platform} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="item-price">
                      <p>
                        NPR {((item.salePrice || item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="order-summary">
              <h3 className="section-title">Order Summary</h3>
              
              <div className="review-summary-content">
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

              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !cartItems.length}
                className="place-order-button"
              >
                {isPlacingOrder ? (
                  <div className="place-order-loading">
                    <div className="loading-spinner"></div>
                    <span>Placing Order...</span>
                  </div>
                ) : (
                  'Place Order & Continue to Payment'
                )}
              </button>

              {/* Security Notice */}
              <div className="security-notice">
                <div className="security-notice-content">
                  <CheckCircle size={20} />
                  <div>
                    <p className="security-notice-title">
                      Secure Checkout
                    </p>
                    <p className="security-notice-text">
                      Your payment information is encrypted and secure. We never store your payment details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
