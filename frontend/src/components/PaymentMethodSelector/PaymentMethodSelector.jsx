import React, { useState } from 'react';
import { CreditCard, Smartphone, QrCode, Check } from 'lucide-react';
import './PaymentMethodSelector.css';

const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  amount, 
  onPaymentInitiate,
  loading = false,
  disabled = false 
}) => {
  const [customAmount, setCustomAmount] = useState('');

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'GP Credits Wallet',
      description: 'Pay using your wallet balance',
      icon: Smartphone,
      available: true,
      color: '#00d4aa'
    },
    {
      id: 'esewa',
      name: 'eSewa',
      description: 'Pay securely with eSewa',
      icon: CreditCard,
      available: true,
      color: '#4a90e2'
    },
    {
      id: 'khalti',
      name: 'Khalti',
      description: 'Pay with Khalti digital wallet',
      icon: Smartphone,
      available: true,
      color: '#5c2d91'
    },
    {
      id: 'esewa-qr',
      name: 'eSewa QR',
      description: 'Scan QR code and upload receipt',
      icon: QrCode,
      available: true,
      color: '#ff6b35'
    }
  ];

  const handleMethodSelect = (methodId) => {
    if (!disabled && !loading) {
      onMethodChange(methodId);
    }
  };

  const handlePaymentInitiate = () => {
    if (onPaymentInitiate && selectedMethod) {
      onPaymentInitiate(selectedMethod);
    }
  };

  const getMethodIcon = (IconComponent) => {
    return <IconComponent size={24} />;
  };

  return (
    <div className="payment-method-selector">
      <div className="payment-methods-grid">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          const isDisabled = !method.available || disabled || loading;

          return (
            <div
              key={method.id}
              className={`payment-method-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => handleMethodSelect(method.id)}
              style={{ 
                borderColor: isSelected ? method.color : '#e0e0e0',
                backgroundColor: isSelected ? `${method.color}10` : '#fff'
              }}
            >
              <div className="payment-method-icon" style={{ color: method.color }}>
                {getMethodIcon(IconComponent)}
              </div>
              
              <div className="payment-method-content">
                <h4 className="payment-method-name">{method.name}</h4>
                <p className="payment-method-description">{method.description}</p>
              </div>

              {isSelected && (
                <div className="payment-method-check">
                  <Check size={20} color={method.color} />
                </div>
              )}

              {!method.available && (
                <div className="payment-method-unavailable">
                  <span>Coming Soon</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedMethod && (
        <div className="payment-method-actions">
          <div className="payment-amount-display">
            <span className="amount-label">Amount:</span>
            <span className="amount-value">NRS {amount ? (amount / 100).toFixed(2) : '0.00'}</span>
          </div>

          <button
            className="btn btn-primary payment-initiate-btn"
            onClick={handlePaymentInitiate}
            disabled={loading || disabled || !amount}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                {selectedMethod === 'wallet' && 'Pay with Wallet'}
                {selectedMethod === 'esewa' && 'Pay with eSewa'}
                {selectedMethod === 'khalti' && 'Pay with Khalti'}
                {selectedMethod === 'esewa-qr' && 'Generate QR Code'}
              </>
            )}
          </button>
        </div>
      )}

      {selectedMethod && selectedMethod !== 'wallet' && (
        <div className="payment-method-info">
          <div className="info-card">
            <h5>Payment Security</h5>
            <ul>
              <li>✓ SSL encrypted transactions</li>
              <li>✓ PCI DSS compliant</li>
              <li>✓ Real-time verification</li>
              <li>✓ Instant wallet credit</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
