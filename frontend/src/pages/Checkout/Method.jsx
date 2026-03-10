import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import './Method.css';

const Method = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { total, shippingMethod, orderId } = location.state || {};

  const handleContinue = () => {
    navigate('/checkout/payment', {
      state: { total, shippingMethod, orderId }
    });
  };

  return (
    <div className="method-container">
      <div className="method-wrapper">
        <h1 className="method-title">Select Payment Method</h1>

        <div className="method-options">
          <label className="method-option selected">
            <input type="radio" name="payment" value="esewa" checked readOnly />
            <div className="method-content">
              <div className="method-icon wallet">
                <Smartphone size={24} />
              </div>
              <div className="method-info">
                <h3>eSewa</h3>
                <p>Complete your order through the eSewa payment gateway</p>
              </div>
            </div>
          </label>
        </div>

        <button className="method-button" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default Method;
