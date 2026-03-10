import React from 'react';
import PropTypes from 'prop-types';
import { QrCode, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './QRPayInstructions.css';
import api from '../../services/api';

const QRPayInstructions = ({ amount, orderCode, onPaymentSubmit, qrImageUrl }) => {
  // Prefer explicit prop, then frontend env var, then derive from API base, finally a public fallback
  const envQr = import.meta.env.VITE_FONEPAY_QR_IMAGE_URL;
  const apiRoot = (api?.defaults?.baseURL || '').replace(/\/?api$/, '');
  const derivedQr = apiRoot ? `${apiRoot}/uploads/qr/fonepay.png` : '/fonepay-qr.png';
  const FONEPAY_QR_URL = qrImageUrl || envQr || derivedQr;

  return (
    <div className="qr-pay-instructions">
      <div className="qr-header">
        <QrCode size={32} className="qr-icon" />
        <h2>Fonepay QR Payment</h2>
      </div>

      <div className="qr-content">
        <div className="qr-code-section">
          <div className="qr-code-container">
            <img 
              src={FONEPAY_QR_URL} 
              alt="Fonepay QR Code" 
              className="qr-code-image"
            />
            <div className="qr-overlay">
              <span className="qr-label">Scan to Pay</span>
            </div>
          </div>
          
          <div className="payment-details">
            <div className="detail-item">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">NPR {typeof amount === 'number' ? amount.toFixed(2) : '0.00'}</span>
            </div>
            {orderCode && (
              <div className="detail-item">
                <span className="detail-label">Order Code:</span>
                <span className="detail-value">{orderCode}</span>
              </div>
            )}
          </div>
        </div>

        <div className="instructions-section">
          <h3>Payment Instructions</h3>
          <div className="instruction-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Scan QR Code</h4>
                <p>Open your Fonepay app and scan the QR code above</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Pay Exact Amount</h4>
                <p>Pay exactly <strong>NPR {amount?.toFixed(2)}</strong></p>
                {orderCode && <p>Add <strong>{orderCode}</strong> in remarks if possible</p>}
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Upload Receipt</h4>
                <p>Take a screenshot of your payment receipt and upload it below</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Wait for Verification</h4>
                <p>Our admin will verify your payment within 24 hours</p>
              </div>
            </div>
          </div>

          <div className="important-notes">
            <div className="note-item">
              <AlertCircle size={16} />
              <span>Pay the exact amount to avoid delays</span>
            </div>
            <div className="note-item">
              <Clock size={16} />
              <span>Payment verification takes up to 24 hours</span>
            </div>
            <div className="note-item">
              <CheckCircle size={16} />
              <span>You'll receive email confirmation once approved</span>
            </div>
          </div>

          <button 
            className="btn btn-primary payment-submit-btn"
            onClick={onPaymentSubmit}
          >
            I've Paid - Upload Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

QRPayInstructions.propTypes = {
  amount: PropTypes.number,
  orderCode: PropTypes.string,
  onPaymentSubmit: PropTypes.func.isRequired
};

QRPayInstructions.defaultProps = {
  amount: 0,
  orderCode: ''
};

export default QRPayInstructions;

