import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import paymentAPI from '../../services/paymentAPI';
import './PaymentPages.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check for eSewa callback data (base64 encoded)
        const dataParam = searchParams.get('data');
        let transaction_uuid, total_amount, product_code, signature, pidx;

        console.log('Payment Success URL params:', Object.fromEntries(searchParams.entries()));
        console.log('Data param:', dataParam);

        if (dataParam) {
          // eSewa sends data as base64 encoded JSON
          try {
            const decodedData = JSON.parse(atob(dataParam));
            console.log('Decoded eSewa data:', decodedData);
            transaction_uuid = decodedData.transaction_uuid;
            total_amount = decodedData.total_amount;
            product_code = decodedData.product_code;
            signature = decodedData.signature;
          } catch (decodeError) {
            console.error('Failed to decode eSewa data:', decodeError);
            setError('Invalid payment data received');
            setLoading(false);
            return;
          }
        } else {
          // Fallback to individual parameters
          transaction_uuid = searchParams.get('transaction_uuid');
          total_amount = searchParams.get('total_amount');
          product_code = searchParams.get('product_code');
          signature = searchParams.get('signature');
          pidx = searchParams.get('pidx');
        }

        console.log('Payment verification data:', {
          transaction_uuid,
          total_amount,
          product_code,
          signature,
          pidx
        });

        if (transaction_uuid && total_amount && product_code && signature) {
          // eSewa payment verification
          const response = await paymentAPI.verifyEsewaPayment({
            transaction_uuid,
            total_amount,
            product_code,
            signature
          });

          if (response.data.success) {
            setPaymentData({
              amount: total_amount,
              gateway: 'eSewa',
              status: 'SUCCESS'
            });
          } else {
            setError('Payment verification failed');
          }
        } else if (pidx) {
          // Khalti payment verification
          const response = await paymentAPI.verifyKhaltiPayment({ pidx });

          if (response.data.success) {
            setPaymentData({
              amount: response.data.data.amount / 100, // Convert from paisa
              gateway: 'Khalti',
              status: 'SUCCESS'
            });
          } else {
            setError('Payment verification failed');
          }
        } else {
          setError('Invalid payment parameters');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToProfile = () => {
    navigate('/profile/wallet');
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

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-error">
            <div className="error-icon">
              <CheckCircle size={64} color="#ff4757" />
            </div>
            <h2>Payment Verification Failed</h2>
            <p>{error}</p>
            <div className="payment-actions">
              <button className="btn btn-outline" onClick={handleGoHome}>
                <ArrowLeft size={16} />
                Go Home
              </button>
              <button className="btn btn-primary" onClick={handleGoToProfile}>
                Check Wallet
              </button>
            </div>
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
              Check Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
