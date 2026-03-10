import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import paymentAPI from '../../services/paymentAPI';
import { useCart } from '../../context/CartContext';
import './PaymentPages.css';

const EsewaSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { finalizePendingCheckout } = useCart();
    const hasVerifiedRef = useRef(false);
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your payment with eSewa...');
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        if (hasVerifiedRef.current) {
            return;
        }

        hasVerifiedRef.current = true;

        const verifyPayment = async () => {
            try {
                const dataStr = searchParams.get('data');
                if (!dataStr) {
                    setStatus('error');
                    setMessage('No payment data received from eSewa.');
                    return;
                }

                const response = await paymentAPI.verifyEsewa(dataStr);
                if (response.data.success) {
                    const verifiedOrderId = response.data.data?.orderId || null;
                    if (verifiedOrderId) {
                        finalizePendingCheckout(verifiedOrderId);
                    }
                    setStatus('success');
                    setMessage('Payment verified successfully!');
                    setOrderId(verifiedOrderId);
                } else {
                    setStatus('error');
                    setMessage(response.data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error('eSewa verification error:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'An error occurred during verification.');
            }
        };

        verifyPayment();
    }, [searchParams, finalizePendingCheckout]);

    return (
        <div className="payment-page">
            <div className="payment-card">
                {status === 'verifying' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                            <Loader className="icon-spin" size={72} style={{ color: '#3b82f6' }} />
                        </div>
                        <h2>Verifying Payment</h2>
                        <p className="muted mt-4">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="success-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                            <CheckCircle size={72} style={{ color: '#10b981' }} />
                        </div>
                        <h2>Payment Successful!</h2>
                        <p className="muted mt-4">{message}</p>
                        {orderId && <p className="muted-sm mt-2">Order ID: {orderId}</p>}
                        <div className="payment-actions">
                            <button
                                className="btn btn-primary mt-4"
                                onClick={() => navigate('/profile/orders')}
                            >
                                View Orders
                            </button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="error-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                            <AlertCircle size={72} style={{ color: '#ef4444' }} />
                        </div>
                        <h2>Payment Failed</h2>
                        <p className="muted mt-4">{message}</p>
                        <p className="muted-sm mt-2">Please contact support if the amount was deducted from your account.</p>
                        <div className="payment-actions">
                            <button
                                className="btn btn-outline mt-4"
                                onClick={() => navigate('/cart')}
                            >
                                Back to Cart
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EsewaSuccess;
