import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import './PaymentPages.css';

const EsewaFailure = () => {
    const navigate = useNavigate();

    return (
        <div className="payment-page">
            <div className="payment-card">
                <div className="failure-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <XCircle size={72} style={{ color: '#ef4444' }} />
                </div>
                <h2>Payment Cancelled</h2>
                <p className="muted mt-4">The payment was cancelled or failed.</p>
                <p className="muted-sm mt-2">If you faced any issues, please try again or choose a different payment method.</p>
                <div className="payment-actions mt-8">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/checkout')}
                    >
                        Try Again
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate('/cart')}
                    >
                        Back to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EsewaFailure;
