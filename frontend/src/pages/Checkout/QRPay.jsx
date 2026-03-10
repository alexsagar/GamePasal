import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Clock } from 'lucide-react';
import QRBlock from '../../components/QRPayInstructions/QRBlock';
import paymentAPI from '../../services/paymentAPI';
import './QRPay.css';

const QRPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [qrData, setQrData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const { total, shippingMethod } = location.state || {};

  useEffect(() => {
    // Generate QR code on component mount
    const generateQR = async () => {
      try {
        const response = await paymentAPI.createQRPayment(total, shippingMethod);
        setQrData(response.data);
        
        // Start polling for payment status
        const pollInterval = setInterval(async () => {
          const status = await paymentAPI.checkPaymentStatus(response.data.paymentId);
          if (status.paid) {
            clearInterval(pollInterval);
            clearCart();
            navigate('/checkout/success', { 
              state: { orderId: status.orderId } 
            });
          }
        }, 5000);

        // Cleanup polling on unmount
        return () => clearInterval(pollInterval);
      } catch (error) {
        console.error('Error generating QR:', error);
        navigate('/checkout/payment');
      }
    };

    generateQR();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      navigate('/checkout/payment');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!qrData) {
    return (
      <div className="qr-container">
        <div className="qr-loading">
          Generating QR Code...
        </div>
      </div>
    );
  }

  return (
    <div className="qr-container">
      <div className="qr-wrapper">
        <h1 className="qr-title">Scan QR Code to Pay</h1>
        
        <div className="qr-timer">
          <Clock size={20} />
          <span>Time remaining: {formatTime(timeLeft)}</span>
        </div>

        <div className="qr-content">
          <div className="qr-code-section">
            <QRBlock
              qrImageUrl={qrData?.qrImageUrl}
              qrData={qrData?.qrImage}
              amount={total || 0}
              merchantName={qrData?.merchantName || 'GamePasal'}
            />
          </div>

          <div className="qr-instructions">
            <h2>How to pay with Fonepay</h2>
            <ol>
              <li>Open your Fonepay mobile app</li>
              <li>Tap on 'Scan QR' button</li>
              <li>Point your camera at the QR code</li>
              <li>Review and confirm the payment</li>
            </ol>
            <p className="qr-note">
              * Do not close this page until payment is confirmed
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/checkout/payment')}
          className="qr-cancel-button"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default QRPay;
