import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import './PaymentPages.css';

const QRProcessing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    fetchOrder();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchOrder, 15000);
    
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!order) return null;

    switch (order.status) {
      case 'AWAITING_VERIFICATION':
        return {
          icon: <Clock size={48} className="status-icon pending" />,
          title: 'Payment Under Review',
          message: 'We received your payment proof and our admin is reviewing it. This usually takes up to 24 hours.',
          color: '#ffa500'
        };
      case 'PAID':
        return {
          icon: <CheckCircle size={48} className="status-icon success" />,
          title: 'Payment Approved!',
          message: 'Your payment has been verified and approved. You should receive your order details via email shortly.',
          color: '#28a745'
        };
      case 'REJECTED':
        return {
          icon: <XCircle size={48} className="status-icon error" />,
          title: 'Payment Rejected',
          message: 'Your payment could not be verified. Please try again or contact support.',
          color: '#dc3545'
        };
      case 'CANCELLED':
        return {
          icon: <XCircle size={48} className="status-icon error" />,
          title: 'Order Cancelled',
          message: 'This order has been cancelled.',
          color: '#6c757d'
        };
      default:
        return {
          icon: <Clock size={48} className="status-icon pending" />,
          title: 'Processing...',
          message: 'Your order is being processed.',
          color: '#007bff'
        };
    }
  };

  const handleRetryPayment = () => {
    navigate(`/checkout?retry=${orderId}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  if (loading && !order) {
    return (
      <div className="payment-processing-page">
        <div className="processing-container">
          <div className="loading-spinner large"></div>
          <h2>Loading order status...</h2>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="payment-processing-page">
        <div className="processing-container error">
          <XCircle size={48} className="status-icon error" />
          <h2>Error Loading Order</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleGoHome}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="payment-processing-page">
      <div className="processing-container">
        {statusDisplay?.icon}
        
        <h1 style={{ color: statusDisplay?.color }}>{statusDisplay?.title}</h1>
        
        <p className="status-message">{statusDisplay?.message}</p>

        {order && (
          <div className="order-details">
            <div className="detail-row">
              <span>Order Code:</span>
              <span>{order.orderCode || order.orderNumber}</span>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>NPR {order.totalPaisa ? (order.totalPaisa / 100).toFixed(2) : order.total?.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span className={`status-badge ${order.status.toLowerCase()}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        <div className="action-buttons">
          {order?.status === 'AWAITING_VERIFICATION' && (
            <>
              <button className="btn btn-secondary" onClick={fetchOrder}>
                <RefreshCw size={16} />
                Refresh Status
              </button>
              <button className="btn btn-outline" onClick={handleContactSupport}>
                Contact Support
              </button>
            </>
          )}
          
          {order?.status === 'PAID' && (
            <button className="btn btn-primary" onClick={handleGoHome}>
              Continue Shopping
            </button>
          )}
          
          {(order?.status === 'REJECTED' || order?.status === 'CANCELLED') && (
            <>
              <button className="btn btn-primary" onClick={handleRetryPayment}>
                Try Again
              </button>
              <button className="btn btn-outline" onClick={handleContactSupport}>
                Contact Support
              </button>
            </>
          )}
        </div>

        {order?.status === 'AWAITING_VERIFICATION' && (
          <div className="auto-refresh-notice">
            <Clock size={16} />
            <span>This page refreshes automatically every 15 seconds</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRProcessing;

