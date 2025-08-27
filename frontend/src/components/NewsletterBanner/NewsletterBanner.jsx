import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import api from '../../services/api';
import './NewsletterBanner.css';

const NewsletterBanner = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/newsletter/subscribe', { email, source: 'homepage-banner' });
      setStatus({ type: 'success', message: res.data.message || 'Subscribed!' });
      setEmail('');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to subscribe';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="newsletter-banner">
      <div className="nb-overlay">
        <h2 className="nb-title">SAVE 5%</h2>
        <p className="nb-subtitle">Subscribe to our newsletter and get 5% off your first order!</p>
        <form className="nb-form" onSubmit={handleSubscribe}>
          <div className="nb-input-wrapper">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="nb-button" type="submit" disabled={loading}>{loading ? 'Subscribing...' : 'Subscribe'}</button>
        </form>
        {status && (
          <div className={`nb-status ${status.type}`}>{status.message}</div>
        )}
      </div>
    </div>
  );
};

export default NewsletterBanner; 