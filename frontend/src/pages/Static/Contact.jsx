import React, { useState } from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Contact = () => {
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Thanks! We will get back to you.');
  };

  return (
    <div className="static-page">
      <SEO
        title="Contact GamePasal | Support for Nepal"
        description="Contact GamePasal for support with orders, payments, and gift card redemption in Nepal."
        keywords="contact GamePasal, support Nepal gaming, help gift cards Nepal"
        canonical="https://www.gamepasal.com/contact"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Contact Us</h1>
          <p className="static-subtitle">We usually respond within 1 business day</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="static-section">
            <label className="muted">Your Email</label>
            <input type="email" required className="form-input" placeholder="you@example.com" />
          </div>
          <div className="static-section">
            <label className="muted">Message</label>
            <textarea required rows="5" className="form-input" placeholder="How can we help?" />
          </div>
          <button className="btn btn-primary" type="submit">Send</button>
          {status && <p className="muted" style={{ marginTop: 12 }}>{status}</p>}
        </form>
      </div>
    </div>
  );
};

export default Contact;


