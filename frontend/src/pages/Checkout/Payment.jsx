import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, ArrowLeft } from 'lucide-react';
import paymentAPI from '../../services/paymentAPI';
import toast from 'react-hot-toast';
import './Payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentState] = useState({
    orderId: location.state?.orderId || '',
    total: location.state?.total || 0,
    guestEmail: location.state?.guestEmail || '',
    isGuest: location.state?.isGuest || false
  });
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);

  const { orderId, total, guestEmail, isGuest } = paymentState;

  useEffect(() => {
    const missingFields = [];
    if (!orderId) missingFields.push('Order ID');
    if (!total) missingFields.push('Total amount');

    if (missingFields.length > 0) {
      toast.error(`Missing payment information: ${missingFields.join(', ')}`);
      navigate('/cart');
    }
  }, [orderId, total, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePaymentMethodSelect = async () => {
    setSelectedMethod('esewa');
    setLoading(true);

    try {
      const esewaRes = await paymentAPI.initiateEsewa(orderId);
      const esewaData = esewaRes.data?.data;
      if (!esewaData?.signature) {
        throw new Error('Failed to generate eSewa payment signature');
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = esewaData.gateway_url;

      const fields = {
        amount: esewaData.amount,
        tax_amount: esewaData.tax_amount,
        total_amount: esewaData.total_amount,
        transaction_uuid: esewaData.transaction_uuid,
        product_code: esewaData.product_code,
        product_service_charge: esewaData.product_service_charge,
        product_delivery_charge: esewaData.product_delivery_charge,
        success_url: esewaData.success_url,
        failure_url: esewaData.failure_url,
        signed_field_names: esewaData.signed_field_names,
        signature: esewaData.signature
      };

      for (const key in fields) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error('Failed to initiate eSewa payment');
      setLoading(false);
    }
  };

  return (
    <div className="gp-pay-container">
      <div className="gp-pay-wrapper">
        <div className="gp-pay-header">
          <button onClick={handleBack} className="gp-pay-back-btn">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="gp-pay-title">Select Payment Method</h1>
        </div>

        <div className="gp-pay-content">
          <div className="gp-pay-grid">
            <div className="gp-pay-methods">
              <button
                className={`gp-pay-method-btn ${selectedMethod === 'esewa' ? 'selected' : ''}`}
                onClick={handlePaymentMethodSelect}
                disabled={loading}
              >
                <div className="gp-pay-method-icon wallet">
                  <Smartphone size={24} />
                </div>
                <div className="gp-pay-method-info">
                  <div className="gp-pay-method-title">eSewa</div>
                  <div className="gp-pay-method-desc">Pay securely using the eSewa payment gateway</div>
                </div>
              </button>
            </div>

            <div className="gp-pay-details">
              {selectedMethod === 'esewa' ? (
                <div className="gp-card gp-instructions">
                  <h3>How to pay</h3>
                  <ol>
                    <li>You will be redirected to the official eSewa payment page.</li>
                    <li>Log in to your eSewa account and complete the payment.</li>
                    <li>After payment, you will return here for verification.</li>
                  </ol>
                </div>
              ) : (
                <div className="gp-empty-right">eSewa is the only available checkout method.</div>
              )}

              <div className="gp-pay-summary">
                <h3>Order Summary</h3>
                <div className="gp-pay-summary-details">
                  <div className="gp-pay-summary-row">
                    <span>Total Amount:</span>
                    <span className="gp-pay-amount">NPR {total.toFixed(2)}</span>
                  </div>
                  {isGuest && (
                    <div className="gp-pay-guest-email">
                      Order details will be sent to: {guestEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
