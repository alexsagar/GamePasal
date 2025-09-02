import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ShoppingBag, 
  Settings,
  Eye,
  EyeOff,
  Save,
  Edit,
  Trash2,
  AlertCircle,
  Shield,
  Smartphone,
  Facebook,
  Twitter,
  Mail as MailIcon,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api, { walletAPI } from '../../services/api';
import paymentAPI from '../../services/paymentAPI';
import PaymentMethodSelector from '../../components/PaymentMethodSelector/PaymentMethodSelector';
import { toDataURL as qrToDataURL } from 'qrcode';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Social Media and 2FA states
  const [socialAccounts, setSocialAccounts] = useState({
    google: false,
    facebook: false,
    twitter: false
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFABackupCodes, setTwoFABackupCodes] = useState([]);
  const [twoFAVerificationCode, setTwoFAVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [twoFAOtpauthUrl, setTwoFAOtpauthUrl] = useState('');
  const [twoFAQrImage, setTwoFAQrImage] = useState('');

  // Sync active tab with URL param
  useEffect(() => {
    const allowedTabs = ['profile', 'orders', 'wishlist', 'wallet', 'settings'];
    const next = section && allowedTabs.includes(section) ? section : 'profile';
    setActiveTab(next);
  }, [section]);

  // Fetch user's real orders
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  // Fetch user's social accounts and 2FA status
  useEffect(() => {
    if (user) {
      fetchUserSecurityInfo();
    }
  }, [user]);

  // Wallet state
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletBalancePaisa, setWalletBalancePaisa] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('GP Credits');
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [topupAmountNPR, setTopupAmountNPR] = useState('');
  const [topupReferenceNote, setTopupReferenceNote] = useState('');
  const [currentTopupTxnId, setCurrentTopupTxnId] = useState('');
  const [qrMeta, setQrMeta] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  
  // Payment gateway states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const formatNPR = (paisa) => `NRS ${(Math.round(paisa) / 100).toFixed(2)}`;

  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const res = await walletAPI.getMyWallet({ page: 1, limit: 20 });
      const d = res.data?.data || {};
      setWalletBalancePaisa(d.balancePaisa || 0);
      setWalletCurrency(d.currency || 'GP Credits');
      setWalletTransactions(d.transactions || []);
    } catch (e) {
      console.error('Wallet load error:', e);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWallet();
    }
  }, [activeTab]);

  const initTopup = async () => {
    const amountNum = Number(topupAmountNPR);
    if (!amountNum || amountNum < 100 || amountNum > 25000) {
      setMessage({ type: 'error', text: 'Enter amount between NPR 100 and 25,000' });
      return;
    }
    setMessage({ type: '', text: '' });
    try {
      const idempotencyKey = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
      const res = await walletAPI.initTopupEsewaQR({
        amountPaisa: Math.round(amountNum * 100),
        idempotencyKey,
        referenceNote: topupReferenceNote || ''
      });
      if (res.data?.success) {
        setCurrentTopupTxnId(res.data.data.txnId);
        setQrMeta(res.data.data.qr);
        setMessage({ type: 'success', text: 'Top-up ticket created. Upload your receipt after payment.' });
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to create top-up ticket' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to create top-up ticket' });
    }
  };

  const uploadReceipt = async () => {
    if (!currentTopupTxnId || !receiptFile) {
      setMessage({ type: 'error', text: 'Please select a receipt file' });
      return;
    }
    try {
      const fd = new FormData();
      fd.append('txnId', currentTopupTxnId);
      fd.append('file', receiptFile);
      if (topupReferenceNote) fd.append('referenceNote', topupReferenceNote);
      const res = await walletAPI.uploadReceipt(fd);
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Receipt uploaded. Your top-up is under review.' });
        setReceiptFile(null);
        fetchWallet();
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to upload receipt' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to upload receipt' });
    }
  };

  // Payment gateway functions
  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentInitiate = async (method) => {
    const amountNum = Number(topupAmountNPR);
    if (!amountNum || amountNum < 100 || amountNum > 100000) {
      setMessage({ type: 'error', text: 'Enter amount between NPR 100 and 100,000' });
      return;
    }

    setPaymentLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const idempotencyKey = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
      
      if (method === 'esewa-qr') {
        // Use existing QR method
        const res = await walletAPI.initTopupEsewaQR({
          amountPaisa: Math.round(amountNum * 100),
          idempotencyKey,
          referenceNote: topupReferenceNote || ''
        });
        
        if (res.data?.success) {
          setCurrentTopupTxnId(res.data.data.txnId);
          setQrMeta(res.data.data.qr);
          setMessage({ type: 'success', text: 'Top-up ticket created. Upload your receipt after payment.' });
        } else {
          setMessage({ type: 'error', text: res.data?.message || 'Failed to create top-up ticket' });
        }
      } else if (method === 'esewa' || method === 'khalti') {
        // Use gateway payment
        const res = await paymentAPI.initTopupGateway({
          amountPaisa: Math.round(amountNum * 100),
          gateway: method.toUpperCase(),
          idempotencyKey,
          referenceNote: topupReferenceNote || ''
        });
        
        if (res.data?.success) {
          if (res.data.data.gateway === 'ESEWA' && res.data.data.formData) {
            // For eSewa, submit form data
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = res.data.data.paymentUrl;
            form.target = '_self';
            
            Object.keys(res.data.data.formData).forEach(key => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = res.data.data.formData[key];
              form.appendChild(input);
            });
            
            document.body.appendChild(form);
            form.submit();
          } else if (res.data.data.paymentUrl) {
            // For other gateways, redirect to payment gateway
            window.location.href = res.data.data.paymentUrl;
          } else {
            setMessage({ type: 'error', text: 'Payment URL not received' });
          }
        } else {
          setMessage({ type: 'error', text: res.data?.message || 'Failed to initiate payment' });
        }
      }
    } catch (e) {
      console.error('Payment initiation error:', e);
      setMessage({ type: 'error', text: 'Failed to initiate payment' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchUserSecurityInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response?.data?.data ?? response?.data?.user ?? response?.data ?? {};
      
      setSocialAccounts({
        google: userData?.socialAccounts?.google?.verified || false,
        facebook: userData?.socialAccounts?.facebook?.verified || false,
        twitter: userData?.socialAccounts?.twitter?.verified || false
      });
      
      setTwoFactorEnabled(userData?.twoFactorAuth?.enabled || false);
    } catch (error) {
      console.error('Error fetching user security info:', error);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.get('/orders/user');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage({ type: 'error', text: 'Failed to load order history' });
    } finally {
      setOrdersLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/orders/${orderId}/delete`);
      setMessage({ type: 'success', text: 'Order deleted successfully' });
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error deleting order:', error);
      setMessage({ type: 'error', text: 'Failed to delete order' });
    }
  };

  const getStatusColor = (status, paymentStatus) => {
    // If payment is pending, show pending status regardless of order status
    if (paymentStatus === 'pending') {
      return '#ff9f43'; // Orange for pending
    }
    
    // If payment is failed or cancelled, show error status
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      return '#ff4757'; // Red for failed/cancelled
    }
    
    // If payment is completed, show order status
    switch (status) {
      case 'delivered': return '#00d4aa'; // Green for delivered
      case 'confirmed': return '#3742fa'; // Blue for confirmed
      case 'processing': return '#ff9f43'; // Orange for processing
      case 'pending': return '#ff9f43'; // Orange for pending
      case 'cancelled': return '#ff4757'; // Red for cancelled
      case 'refunded': return '#ff4757'; // Red for refunded
      default: return '#666';
    }
  };

  const getStatusText = (status, paymentStatus) => {
    if (paymentStatus === 'pending') {
      return 'PAYMENT PENDING';
    }
    if (paymentStatus === 'failed') {
      return 'PAYMENT FAILED';
    }
    if (paymentStatus === 'cancelled') {
      return 'CANCELLED';
    }
    if (paymentStatus === 'paid') {
      return status.toUpperCase();
    }
    return 'PENDING';
  };

  const canDeleteOrder = (order) => {
    // Users can only delete orders that are pending or cancelled
    return order.status === 'pending' || order.status === 'cancelled' || order.paymentStatus === 'pending';
  };

  // Social Media Linking Functions
  const linkSocialAccount = async (provider) => {
    try {
      // This would typically open a popup for OAuth
      // For now, we'll simulate the process
      const mockSocialData = {
        id: `mock_${provider}_id_${Date.now()}`,
        email: user.email
      };

      const response = await api.post('/auth/link-social', {
        provider,
        socialId: mockSocialData.id,
        socialEmail: mockSocialData.email
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: `${provider} account linked successfully!` });
        fetchUserSecurityInfo();
      }
    } catch (error) {
      console.error(`Error linking ${provider}:`, error);
      setMessage({ type: 'error', text: `Failed to link ${provider} account` });
    }
  };

  const unlinkSocialAccount = async (provider) => {
    if (!window.confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    try {
      const response = await api.delete('/auth/unlink-social', {
        data: { provider }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: `${provider} account unlinked successfully!` });
        fetchUserSecurityInfo();
      }
    } catch (error) {
      console.error(`Error unlinking ${provider}:`, error);
      setMessage({ type: 'error', text: `Failed to unlink ${provider} account` });
    }
  };

  // Two-Factor Authentication Functions
  const setup2FA = async () => {
    try {
      const response = await api.post('/auth/setup-2fa');
      
      if (response.data.success) {
        const { secret, backupCodes, otpauthUrl, qrCode } = response.data.data || {};
        setTwoFASecret(secret || '');
        setTwoFABackupCodes(backupCodes || []);
        const otpUrl = otpauthUrl || qrCode || '';
        setTwoFAOtpauthUrl(otpUrl);
        if (otpUrl) {
          try {
            const dataUrl = await qrToDataURL(otpUrl, { margin: 1, width: 200 });
            setTwoFAQrImage(dataUrl);
          } catch (qrErr) {
            console.error('Failed to generate QR image:', qrErr);
            setTwoFAQrImage('');
          }
        } else {
          setTwoFAQrImage('');
        }
        setShow2FASetup(true);
        setMessage({ type: 'success', text: '2FA setup initiated. Please verify the code.' });
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to setup 2FA' });
    }
  };

  const verify2FA = async () => {
    if (!twoFAVerificationCode) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    try {
      const response = await api.post('/auth/verify-2fa', {
        code: twoFAVerificationCode
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: '2FA enabled successfully!' });
        setShow2FASetup(false);
        setTwoFASecret('');
        setTwoFABackupCodes([]);
        setTwoFAVerificationCode('');
        fetchUserSecurityInfo();
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setMessage({ type: 'error', text: 'Invalid verification code' });
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      const response = await api.delete('/auth/disable-2fa');
      
      if (response.data.success) {
        setMessage({ type: 'success', text: '2FA disabled successfully!' });
        fetchUserSecurityInfo();
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to disable 2FA' });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone
      };

      // If password is being changed
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'New passwords do not match' });
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
          setLoading(false);
          return;
        }
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const result = await updateProfile(updateData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
    
    setLoading(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: CheckCircle },
    { id: 'wallet', label: 'Wallet', icon: Smartphone },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div className="profile-info">
            <h1>Welcome back, {user?.username}!</h1>
            <p>Manage your account and view your gaming library</p>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <nav className="profile-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => navigate(`/profile/${tab.id}`)}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="profile-main">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>Profile Information</h2>
                  <button
                    className="btn btn-outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit size={16} />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {message.text && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <div className="input-group">
                        <User className="input-icon" size={20} />
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="form-input"
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-input"
                          disabled={!isEditing}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div className="input-group">
                      <Phone className="input-icon" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <>
                      <div className="password-section">
                        <h3>Change Password (Optional)</h3>
                        
                        <div className="form-group">
                          <label className="form-label">Current Password</label>
                          <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="currentPassword"
                              value={formData.currentPassword}
                              onChange={handleInputChange}
                              className="form-input"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div className="input-group">
                              <Lock className="input-icon" size={20} />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="Enter new password"
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div className="input-group">
                              <Lock className="input-icon" size={20} />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="Confirm new password"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>Order History</h2>
                  <p>{orders.length} orders found</p>
                </div>

                {ordersLoading ? (
                  <div className="loading-message">
                    <AlertCircle size={24} />
                    Loading order history...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="no-orders-message">
                    <ShoppingBag size={24} />
                    No orders found. Start shopping!
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div className="order-info">
                            <h3>Order #{order.id}</h3>
                            <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="order-status">
                            <span 
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(order.status, order.paymentStatus) }}
                            >
                              {getStatusText(order.status, order.paymentStatus)}
                            </span>
                          </div>
                        </div>

                        <div className="order-items">
                          {order.products.map((item, index) => (
                            <div key={index} className="order-item">
                              <span className="item-name">{item.title}</span>
                              <span className="item-price">NRS {item.salePrice || item.price}</span>
                            </div>
                          ))}
                        </div>

                        <div className="order-footer">
                          <div className="order-total">
                            Total: NRS {order.totalAmount}
                          </div>
                          <div className="order-actions">
                            <button className="btn btn-outline">
                              View Details
                            </button>
                            {canDeleteOrder(order) && (
                              <button 
                                className="btn btn-outline danger"
                                onClick={() => deleteOrder(order.id)}
                                disabled={loading}
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>Account Settings</h2>
                  <p>Manage your account preferences and security</p>
                </div>

                <div className="settings-grid">
                  <div className="setting-card">
                    <h3>Email Notifications</h3>
                    <p>Receive updates about your orders and new games</p>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-card">
                    <h3>SMS Notifications</h3>
                    <p>Get SMS alerts for important updates</p>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-card">
                    <h3>Marketing Emails</h3>
                    <p>Receive promotional offers and deals</p>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-card">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                    {twoFactorEnabled ? (
                      <div className="setting-actions">
                        <span className="status-badge enabled">Enabled</span>
                        <button className="btn btn-outline danger" onClick={disable2FA}>
                          Disable 2FA
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-outline" onClick={setup2FA}>
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>

                {/* Social Media Linking Section */}
                <div className="social-linking-section">
                  <h3>Linked Accounts</h3>
                  <p>Connect your social media accounts for easier login and verification</p>
                  
                  <div className="social-accounts-grid">
                    <div className="social-account-card">
                      <div className="social-account-info">
                        <Facebook size={24} />
                        <div>
                          <h4>Facebook</h4>
                          <p>Connect your Facebook account</p>
                        </div>
                      </div>
                      {socialAccounts.facebook ? (
                        <div className="social-account-actions">
                          <span className="status-badge linked">Linked</span>
                          <button 
                            className="btn btn-outline danger" 
                            onClick={() => unlinkSocialAccount('facebook')}
                          >
                            Unlink
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => linkSocialAccount('facebook')}
                        >
                          Link Account
                        </button>
                      )}
                    </div>

                    <div className="social-account-card">
                      <div className="social-account-info">
                        <MailIcon size={24} />
                        <div>
                          <h4>Google</h4>
                          <p>Connect your Google account</p>
                        </div>
                      </div>
                      {socialAccounts.google ? (
                        <div className="social-account-actions">
                          <span className="status-badge linked">Linked</span>
                          <button 
                            className="btn btn-outline danger" 
                            onClick={() => unlinkSocialAccount('google')}
                          >
                            Unlink
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => linkSocialAccount('google')}
                        >
                          Link Account
                        </button>
                      )}
                    </div>

                    <div className="social-account-card">
                      <div className="social-account-info">
                        <Twitter size={24} />
                        <div>
                          <h4>Twitter</h4>
                          <p>Connect your Twitter account</p>
                        </div>
                      </div>
                      {socialAccounts.twitter ? (
                        <div className="social-account-actions">
                          <span className="status-badge linked">Linked</span>
                          <button 
                            className="btn btn-outline danger" 
                            onClick={() => unlinkSocialAccount('twitter')}
                          >
                            Unlink
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => linkSocialAccount('twitter')}
                        >
                          Link Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <div className="danger-actions">
                    <button className="btn btn-outline danger">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>Wishlist</h2>
                  <p className="muted">Coming soon</p>
                </div>
                <div className="no-orders-message">
                  <AlertCircle size={24} />
                  Add games to your wishlist to track prices and quick‑buy later.
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>GP Credits Wallet</h2>
                  <p>Top-up via eSewa QR and upload receipt for review</p>
                </div>

                <div className="setting-card" style={{ marginBottom: 16 }}>
                  <h3>Balance</h3>
                  {walletLoading ? (
                    <p className="muted">Loading balance…</p>
                  ) : (
                    <p style={{ fontSize: 18, fontWeight: 700 }}>{formatNPR(walletBalancePaisa)} <span className="muted">({walletCurrency})</span></p>
                  )}
                </div>

                <div className="setting-card" style={{ marginBottom: 16 }}>
                  <h3>Add Funds to Wallet</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Amount (NPR)</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        min="100" 
                        max="100000" 
                        value={topupAmountNPR} 
                        onChange={(e)=>setTopupAmountNPR(e.target.value)} 
                        placeholder="e.g., 1000" 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reference Note (optional)</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={topupReferenceNote} 
                        onChange={(e)=>setTopupReferenceNote(e.target.value)} 
                        placeholder="Reference note" 
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                      style={{ marginBottom: 16 }}
                    >
                      {showPaymentMethods ? 'Hide Payment Methods' : 'Choose Payment Method'}
                    </button>
                    
                    {showPaymentMethods && (
                      <PaymentMethodSelector
                        selectedMethod={selectedPaymentMethod}
                        onMethodChange={handlePaymentMethodChange}
                        amount={Math.round(Number(topupAmountNPR) * 100) || 0}
                        onPaymentInitiate={handlePaymentInitiate}
                        loading={paymentLoading}
                        disabled={!topupAmountNPR || Number(topupAmountNPR) < 100}
                      />
                    )}
                  </div>
                </div>

                {qrMeta && (
                  <div className="setting-card" style={{ marginBottom: 16 }}>
                    <h3>Scan & Pay</h3>
                    <p className="muted">Scan the eSewa QR to pay, then upload your receipt. We’ll verify within 24 hours.</p>
                    <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                      <img src={qrMeta.qrUrl} alt="eSewa QR" style={{ width: 200, height: 200, background:'#fff', padding:8, borderRadius:8 }} />
                      <div>
                        <p><strong>Account:</strong> {qrMeta.accountName}</p>
                        <p><strong>eSewa ID:</strong> {qrMeta.esewaId}</p>
                        <p className="muted">Include note: GamePasal {user?.username}</p>
                        <div style={{ marginTop: 12 }}>
                          <input type="file" accept="image/*,application/pdf" onChange={(e)=>setReceiptFile(e.target.files?.[0]||null)} />
                          <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={uploadReceipt} disabled={!receiptFile}>Upload Receipt</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="setting-card">
                  <h3>Transactions</h3>
                  {walletLoading ? (
                    <p className="muted">Loading…</p>
                  ) : walletTransactions.length === 0 ? (
                    <p className="muted">No wallet transactions yet.</p>
                  ) : (
                    <div className="orders-list">
                      {walletTransactions.map((t) => (
                        <div key={t._id} className="order-card" style={{ display:'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight:600 }}>{t.type} · {t.method}</div>
                            <div className="muted">{new Date(t.createdAt).toLocaleString()}</div>
                            {t.referenceNote && <div className="muted">Ref: {t.referenceNote}</div>}
                            {t.adminNote && <div className="muted">Admin: {t.adminNote}</div>}
                            {t.receiptUrl && <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer">View receipt</a>}
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:700 }}>{formatNPR(t.amount)}</div>
                            <span className="status-badge" style={{ backgroundColor: t.status==='SUCCESS' ? '#00d4aa' : t.status==='REJECTED' ? '#ff4757' : '#ff9f43' }}>{t.status.replace('_',' ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Setup Two-Factor Authentication</h3>
              <button className="close-btn" onClick={() => setShow2FASetup(false)}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="twofa-setup-steps">
                <div className="step">
                  <h4>Step 1: Scan QR Code</h4>
                  <p>Use your authenticator app to scan this QR code:</p>
                  <div className="qr-code-placeholder">
                    {twoFAQrImage ? (
                      <img src={twoFAQrImage} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
                    ) : (
                      <div className="qr-code">
                        <Shield size={48} />
                        <p>QR Code unavailable</p>
                      </div>
                    )}
                    <div className="qr-manual-secret">
                      <small>Or enter this secret manually:</small>
                      <div className="qr-secret-value">{twoFASecret}</div>
                    </div>
                  </div>
                </div>

                <div className="step">
                  <h4>Step 2: Enter Verification Code</h4>
                  <p>Enter the 6-digit code from your authenticator app:</p>
                  <input
                    type="text"
                    placeholder="000000"
                    value={twoFAVerificationCode}
                    onChange={(e) => setTwoFAVerificationCode(e.target.value)}
                    className="verification-input"
                    maxLength={6}
                  />
                </div>

                <div className="step">
                  <h4>Step 3: Backup Codes</h4>
                  <p>Save these backup codes in a secure location:</p>
                  <div className="backup-codes">
                    {twoFABackupCodes.map((code, index) => (
                      <span key={index} className="backup-code">{code}</span>
                    ))}
                  </div>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? 'Hide Codes' : 'Show Codes'}
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShow2FASetup(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={verify2FA}>
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;