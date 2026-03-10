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
import api from '../../services/api';
import paymentAPI from '../../services/paymentAPI';
import PaymentMethodSelector from '../../components/PaymentMethodSelector/PaymentMethodSelector';
import MaskedSecret from '../../components/MaskedSecret/MaskedSecret';
import OrderStatusBadge from '../../components/OrderStatusBadge/OrderStatusBadge';
import { toDataURL as qrToDataURL } from 'qrcode';
import { getOrderStatusLabel, normalizeOrderStatus as normalizeOrderState } from '../../utils/orderStatus';
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
  const [orderFilter, setOrderFilter] = useState('all');
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
    const allowedTabs = ['profile', 'orders', 'wishlist', 'settings'];
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

  // Image helper for order products
  const RAW_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API_ROOT = (RAW_ROOT || '').replace(/\/$/, '');
  const getProductImage = (img) => {
    if (!img) return '';
    return img.startsWith('http') ? img : `${API_ROOT}/uploads/${img}`;
  };

  const getDisplayStatus = (order) => {
    return getOrderStatusLabel(order?.rawStatus || order?.status, order?.paymentStatus);
  };

  const statusChipStyle = (label) => {
    const base = { display: 'inline-block', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 600 };
    if (label === 'Completed') return { ...base, background: '#10b9811a', color: '#10b981' };
    if (label === 'Delivered') return { ...base, background: '#14b8a61a', color: '#14b8a6' };
    if (label === 'Payment Verified') return { ...base, background: '#0596691a', color: '#059669' };
    if (label === 'Cancelled') return { ...base, background: '#ef44441a', color: '#ef4444' };
    if (label === 'Order Placed' || label === 'Payment Pending') return { ...base, background: '#f59e0b1a', color: '#f59e0b' };
    return { ...base, background: '#3b82f61a', color: '#3b82f6' }; // Processing (Blue)
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
    const normalized = normalizeOrderState(order.status, order.paymentStatus);
    return normalized === 'payment_pending' || normalized === 'cancelled';
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
                <div className="section-header" style={{ alignItems: 'center' }}>
                  <h2>Order History</h2>
                  <div style={{ marginLeft: 'auto' }}>
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="form-select"
                      style={{ background: '#111', color: '#e5e7eb', border: '1px solid #333', padding: '8px 12px', borderRadius: 8 }}
                    >
                      <option value="all">All orders</option>
                      <option value="Completed">Completed</option>
                      <option value="Processing">Processing</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
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
                  <div className="orders-split-list">
                    {orders
                      .map((o) => ({
                        id: o.orderNumber || o.orderCode || o.id || o._id,
                        realId: o._id,
                        date: o.createdAt,
                        status: getDisplayStatus(o),
                        rawStatus: o.status,
                        paymentStatus: o.paymentStatus,
                        total: o.totalAmount,
                        product: o.products?.[0],
                        allProducts: o.products
                      }))
                      .filter((row) => orderFilter === 'all' ? true : row.status === orderFilter)
                      .map((row) => (
                        <ExpandableOrderRow
                          key={row.realId}
                          order={row}
                          getProductImage={getProductImage}
                        />
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

// Sub-component for expandable orders
const ExpandableOrderRow = ({ order, getProductImage }) => {
  const [expanded, setExpanded] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${order.realId}/delivery`);
      setDeliveries(res.data.data || []);
    } catch (e) {
      console.error('Error fetching deliveries:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
          const normalized = normalizeOrderState(order.rawStatus, order.paymentStatus);
          const isReady = normalized === 'completed' || normalized === 'delivered';
    if (!expanded && isReady && deliveries.length === 0) {
      fetchDeliveries();
    }
    setExpanded(!expanded);
  };

  return (
    <div className={`order-row-container ${expanded ? 'expanded' : ''}`} style={{ border: '1px solid #333', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
      <div className="order-row" onClick={handleToggle} style={{ cursor: 'pointer', border: 'none', margin: 0, padding: '16px', background: '#1c1c1c' }}>
        <div className="order-row-left">
          <div className="order-thumb">
            <img src={getProductImage(order.product?.image)} alt={order.product?.title || 'Product'} />
          </div>
          <div>
            <h6 className="order-title">{order.product?.title || 'Digital Product'}</h6>
            <p className="order-id">Order ID: <span>#{order.id}</span></p>
          </div>
        </div>
        <div className="order-col">
          <h6 className="muted-sm">Date</h6>
          <p className="order-text">{new Date(order.date).toLocaleDateString()}</p>
        </div>
        <div className="order-col">
          <h6 className="muted-sm">Status</h6>
          <OrderStatusBadge status={order.rawStatus} paymentStatus={order.paymentStatus} />
        </div>
        <div className="order-col" style={{ marginLeft: 'auto' }}>
          <h6 className="muted-sm">Price</h6>
          <p className="order-text">NRS {order.total?.toFixed ? order.total.toFixed(2) : order.total}</p>
        </div>
      </div>

      {expanded && (
        <div className="order-expanded-details" style={{ padding: '20px', background: '#111', borderTop: '1px solid #333' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Order Details</h4>

          <div className="order-products-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {order.allProducts?.map((item, idx) => {
              // Find matching delivery record if completed
              const deliveryRecord = deliveries.find((d) =>
                String(d.productId?._id || d.productId) === String(item.productId?._id || item.productId)
              );

              return (
                <div key={idx} style={{ padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h5 style={{ margin: 0 }}>{item.title} (x{item.quantity})</h5>
                    <span style={{ fontWeight: 600 }}>NRS {item.price * item.quantity}</span>
                  </div>

                  {(['completed', 'delivered'].includes(normalizeOrderState(order.rawStatus, order.paymentStatus))) && deliveryRecord ? (
                    <div className="delivery-secrets" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }}>
                      <h6 style={{ color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} /> Digital Delivery Complete
                      </h6>

                      {deliveryRecord.delivery_type === 'game_login_details' ? (
                        <>
                          {deliveryRecord.login_email && (
                            <div style={{ marginBottom: '8px' }}>
                              <p className="muted-sm" style={{ marginBottom: '4px' }}>Login Email / Username:</p>
                              <code style={{ background: '#000', padding: '6px 10px', borderRadius: '4px', fontSize: '0.9rem', color: '#fff', display: 'block' }}>
                                {deliveryRecord.login_email}
                              </code>
                            </div>
                          )}
                          <MaskedSecret
                            label="Login Password"
                            value={deliveryRecord.login_password}
                            maskFormat="password"
                            requireConfirm={true}
                          />
                        </>
                      ) : (
                        <MaskedSecret
                          label={deliveryRecord.delivery_type === 'gift_card_code' ? "Gift Card Code" : "Game Redeem Code"}
                          value={deliveryRecord.redeem_code}
                          maskFormat="redeem"
                          requireConfirm={true}
                        />
                      )}

                      {deliveryRecord.instructions && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px' }}>
                          <h6 style={{ color: '#3b82f6', marginBottom: '4px', fontSize: '0.85rem' }}>Instructions:</h6>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                            {deliveryRecord.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (['completed', 'delivered'].includes(normalizeOrderState(order.rawStatus, order.paymentStatus))) && loading ? (
                    <p className="muted-sm">Loading delivery details...</p>
                  ) : (['completed', 'delivered'].includes(normalizeOrderState(order.rawStatus, order.paymentStatus))) ? (
                    <p className="muted-sm text-yellow">Delivery data unavailable. Contact support.</p>
                  ) : (
                    <p className="muted-sm">Delivery details will appear here once the order is completed.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
