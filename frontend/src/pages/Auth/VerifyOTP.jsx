import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api'; // Or authAPI if updated
import './Auth.css';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const { verifyOTP } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to login if no email in state
    const email = location.state?.email;
    const from = location.state?.from || '/';

    useEffect(() => {
        if (!email) {
            navigate('/login', { replace: true });
        }
    }, [email, navigate]);

    const handleOTPVerification = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        const result = await verifyOTP(email, otp);

        if (result.success) {
            toast.success('Account verified! You can now log in.');
            navigate(from, { replace: true });
        } else {
            toast.error(result.message || "OTP verification failed.");
        }
        setLoading(false);
    };

    const resendOTP = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const response = await api.post('/auth/resend-verification', { email });
            if (response.data.success) {
                toast.success('OTP resent to your email.');
            } else {
                toast.error(response.data.message || "Failed to resend OTP.");
            }
        } catch (error) {
            toast.error('Network error. Failed to resend OTP.');
        }
        setLoading(false);
    };

    if (!email) return null;

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Gamepad2 size={32} />
                        <span>GamePasal</span>
                    </div>
                    <h1>Verify Your Email</h1>
                    <p>We've sent a verification code to {email}</p>
                </div>

                <form className="auth-form" onSubmit={handleOTPVerification}>
                    <div className="form-group">
                        <label className="form-label">Verification Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="form-input otp-input"
                            placeholder="Enter 6-digit code"
                            maxLength="6"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Didn't receive the code?{' '}
                        <button
                            onClick={resendOTP}
                            className="auth-link"
                            disabled={loading}
                            type="button"
                        >
                            Resend OTP
                        </button>
                    </p>
                    <p>
                        <button
                            onClick={() => navigate('/login')}
                            className="auth-link"
                            type="button"
                        >
                            Back to Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
