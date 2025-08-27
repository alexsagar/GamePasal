import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Wallet as WalletIcon
} from 'lucide-react';
import api, { checkoutAPI } from '../../services/api';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, walletBalancePaisa } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);
  
  const [formData, setFormData] = useState({
    // Shipping/Contact Details
    fullName: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    country: 'Nepal',
    zipCode: '',
    
    // Payment
    paymentMethod: 'Wallet',
    
    // Notes
    notes: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleStepOne = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const required = ['fullName', 'email', 'phone'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      setError('Please fill in all required fields');
      return;
    }
    
    setStep(2);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isWalletOnly = formData.paymentMethod === 'Wallet' && walletBalancePaisa >= Math.round(getCartTotal() * 100);
      const walletAmountPaisa = isWalletOnly ? Math.round(getCartTotal() * 100) : 0;
      const gatewayMap = { eSewa: 'ESEWA', Khalti: 'KHALTI', BankTransfer: null };
      const gateway = gatewayMap[formData.paymentMethod] || null;

      const response = await checkoutAPI.createIntent({
        items: cartItems.map(i => ({ productId: i._id, quantity: i.quantity })),
        shippingId: null,
        paymentMethod: isWalletOnly ? 'WALLET' : 'GATEWAY',
        walletAmountPaisa,
        gateway,
        idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`
      });

      const data = response.data?.data;
      if (data?.paid) {
        setOrderData({ orderNumber: 'PAID', totalAmount: getCartTotal(), paymentMethod: 'Wallet' });
        setStep(3);
        clearCart();
        return;
      }
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError('Failed to initiate checkout');
    } catch (error) {
      console.error('Order creation error:', error);
      setError(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const walletBalanceNrs = (walletBalancePaisa || 0) / 100;
  const cartTotalNrs = getCartTotal();
  const cartTotalPaisa = Math.round(cartTotalNrs * 100);

  const paymentMethods = [
    {
      id: 'Wallet',
      name: 'Wallet (GP Credits)',
      icon: WalletIcon,
      description: `Use GP Credits to pay for this order. Balance: NPR ${walletBalanceNrs.toFixed(2)}`,
      disabled: walletBalancePaisa <= 0 || walletBalancePaisa < cartTotalPaisa
    },
    {
      id: 'eSewa',
      name: 'eSewa',
      icon: CreditCard,
      description: 'Pay securely with eSewa digital wallet'
    },
    {
      id: 'Khalti',
      name: 'Khalti',
      icon: Smartphone,
      description: 'Pay with Khalti mobile payment'
    },
    {
      id: 'BankTransfer',
      name: 'Bank Transfer',
      icon: Building,
      description: 'Direct bank transfer payment'
    }
  ];

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <AlertCircle size={64} />
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart before checkout</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <button 
            className="back-btn"
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/cart')}
          >
            <ArrowLeft size={20} />
            {step > 1 ? 'Back' : 'Back to Cart'}
          </button>
          
          <div className="checkout-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span>1</span>
              Details
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span>2</span>
              Payment
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span>3</span>
              Confirmation
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="checkout-content">
            <div className="checkout-main">
              <h2>Contact & Delivery Information</h2>
              
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handleStepOne} className="checkout-form">
                <div className="form-section">
                  <h3>Contact Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Delivery Information (Optional)</h3>
                  <p className="section-note">
                    Digital products will be delivered via email. Physical address is optional.
                  </p>
                  
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                      >
                        <option value="Nepal">Nepal</option>
                        
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Order Notes (Optional)</h3>
                  <div className="form-group">
                    <label>Special Instructions</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Any special instructions for your order..."
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  Continue to Payment
                </button>
              </form>
            </div>

            <div className="checkout-sidebar">
              <OrderSummary cartItems={cartItems} total={getCartTotal()} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="checkout-content">
            <div className="checkout-main">
              <h2>Payment Method</h2>
              
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handlePlaceOrder} className="payment-form">
                <div className="payment-methods">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label key={method.id} className="payment-method">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleInputChange}
                          disabled={method.disabled}
                        />
                        <div className="payment-method-content">
                          <div className="payment-method-header">
                            <Icon size={24} />
                            <span className="payment-method-name">{method.name}</span>
                          </div>
                          <p className="payment-method-description">
                            {method.description}
                          </p>
                          {method.id === 'Wallet' && method.disabled && (
                            <p className="payment-method-description" style={{ color:'#f87171' }}>
                              Insufficient wallet balance for this order.
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* No manual wallet amount field; wallet-only is automatic. */}

                <div className="payment-note">
                  <AlertCircle size={20} />
                  <div>
                    <h4>Payment Processing</h4>
                    <p>
                      After placing your order, you will be redirected to complete payment. 
                      Digital products will be delivered to your email once payment is confirmed.
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Place Order - NRS ${getCartTotal().toFixed(2)}`}
                </button>
              </form>
            </div>

            <div className="checkout-sidebar">
              <OrderSummary cartItems={cartItems} total={getCartTotal()} />
              <CustomerInfo formData={formData} />
            </div>
          </div>
        )}

        {step === 3 && orderData && (
          <div className="checkout-success">
            <div className="success-content">
              <CheckCircle size={64} />
              <h2>Order Placed Successfully!</h2>
              <p>Thank you for your order. We've received your request and will process it shortly.</p>
              
              <div className="order-details">
                <h3>Order Details</h3>
                <div className="order-info">
                  <div className="info-row">
                    <span>Order Number:</span>
                    <strong>{orderData.orderNumber}</strong>
                  </div>
                  <div className="info-row">
                    <span>Total Amount:</span>
                    <strong>NRS {orderData.totalAmount}</strong>
                  </div>
                  <div className="info-row">
                    <span>Payment Method:</span>
                    <strong>{orderData.paymentMethod}</strong>
                  </div>
                  <div className="info-row">
                    <span>Status:</span>
                    <strong className="status-pending">Pending Payment</strong>
                  </div>
                </div>
              </div>

              <div className="next-steps">
                <h3>What's Next?</h3>
                <ul>
                  <li>You will receive an order confirmation email shortly</li>
                  <li>Complete payment using your selected payment method</li>
                  <li>Digital products will be delivered to your email once payment is confirmed</li>
                  <li>Track your order status in your profile</li>
                </ul>
              </div>

              <div className="success-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/profile')}
                >
                  View Order History
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Summary Component
const OrderSummary = ({ cartItems, total }) => {
  return (
    <div className="order-summary">
      <h3>Order Summary</h3>
      
      <div className="order-items">
        {cartItems.map((item) => (
          <div key={item._id} className="order-item">
            <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
            <div className="item-details">
              <h4>{item.title}</h4>
              <p className="item-platform">{item.platform}</p>
              <div className="item-pricing">
                <span className="quantity">Qty: {item.quantity}</span>
                <span className="price">
                  NRS {((item.salePrice || item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="order-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>NRS {total.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Tax:</span>
          <span>NRS 0.00</span>
        </div>
        <div className="total-row">
          <span>Shipping:</span>
          <span className="free">Free</span>
        </div>
        <div className="total-row total">
          <span>Total:</span>
          <span>NRS {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

// Customer Info Component
const CustomerInfo = ({ formData }) => {
  return (
    <div className="customer-info">
      <h3>Customer Information</h3>
      <div className="info-details">
        <div className="info-row">
          <span>Name:</span>
          <span>{formData.fullName}</span>
        </div>
        <div className="info-row">
          <span>Email:</span>
          <span>{formData.email}</span>
        </div>
        <div className="info-row">
          <span>Phone:</span>
          <span>{formData.phone}</span>
        </div>
        {formData.address && (
          <div className="info-row">
            <span>Address:</span>
            <span>{formData.address}, {formData.city}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;