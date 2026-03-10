import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import './PaymentPages.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    // Legacy payment success page - no longer used for QR payments
    // QR payments are handled through the QRProcessing page
    setPaymentData({
      amount: '0.00',
      gateway: 'Fonepay QR',
      status: 'SUCCESS'
    });
    setLoading(false);
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToProfile = () => {
    navigate('/profile/orders');
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-loading">
            <RefreshCw className="loading-spinner" size={48} />
            <h2>Verifying Payment...</h2>
            <p>Please wait while we verify your payment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-success">
          <div className="success-icon">
            <CheckCircle size={64} color="#00d4aa" />
          </div>
          
          <h2>Payment Successful!</h2>
          <p>Your payment has been processed successfully</p>
          
          {paymentData && (
            <div className="payment-details">
              <div className="detail-item">
                <span className="label">Amount:</span>
                <span className="value">NRS {paymentData.amount}</span>
              </div>
              <div className="detail-item">
                <span className="label">Gateway:</span>
                <span className="value">{paymentData.gateway}</span>
              </div>
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className="value success">{paymentData.status}</span>
              </div>
            </div>
          )}

          <div className="payment-actions">
            <button className="btn btn-outline" onClick={handleGoHome}>
              <ArrowLeft size={16} />
              Go Home
            </button>
            <button className="btn btn-primary" onClick={handleGoToProfile}>
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
