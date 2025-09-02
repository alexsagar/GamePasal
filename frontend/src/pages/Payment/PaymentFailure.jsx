import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import './PaymentPages.css';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToProfile = () => {
    navigate('/profile/wallet');
  };

  const handleRetry = () => {
    navigate('/profile/wallet');
  };

  // Get error message from URL parameters
  const errorMessage = searchParams.get('error') || 'Payment was cancelled or failed';

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-failure">
          <div className="failure-icon">
            <XCircle size={64} color="#ff4757" />
          </div>
          
          <h2>Payment Failed</h2>
          <p>{errorMessage}</p>
          
          <div className="payment-actions">
            <button className="btn btn-outline" onClick={handleGoHome}>
              <ArrowLeft size={16} />
              Go Home
            </button>
            <button className="btn btn-secondary" onClick={handleRetry}>
              <RefreshCw size={16} />
              Try Again
            </button>
            <button className="btn btn-primary" onClick={handleGoToProfile}>
              Check Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
