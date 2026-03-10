import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Instagram, Mail, ArrowRight } from 'lucide-react';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderId, guestEmail } = location.state || {};

  return (
    <div className="gp-confirm-container">
      <div className="gp-confirm-wrapper">
        <div className="gp-confirm-icon">✅</div>
        
        <h1 className="gp-confirm-title">Order Confirmed!</h1>
        
        <div className="gp-confirm-details">
          <p className="gp-confirm-message">
            Thank you for your order. We've received your payment receipt and will process it shortly.
          </p>
          
          {guestEmail && (
            <div className="gp-confirm-email">
              <Mail size={20} />
              <p>Order details have been sent to: <strong>{guestEmail}</strong></p>
            </div>
          )}

          <div className="gp-confirm-order">
            <span>Order ID:</span> <strong>{orderId}</strong>
          </div>
        </div>

        <div className="gp-confirm-contact">
          <h2>Need Help?</h2>
          <p>For any enquiries, reach out to us on Instagram:</p>
          
          <a 
            href="https://instagram.com/gamepasals" 
            target="_blank" 
            rel="noopener noreferrer"
            className="gp-confirm-instagram"
          >
            <Instagram size={24} />
            <span>@gamepasals</span>
            <ArrowRight size={20} />
          </a>
        </div>

        <Link to="/" className="gp-confirm-home">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
