import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Terms = () => {
  return (
    <div className="static-page">
      <SEO
        title="Terms of Service | GamePasal Nepal"
        description="Read GamePasal's terms of service for buying digital products and gift cards in Nepal."
        keywords="GamePasal terms, digital products Nepal terms, gift cards terms Nepal"
        canonical="https://www.gamepasal.com/terms"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Terms of Service</h1>
          <p className="static-subtitle">Please read these terms carefully</p>
        </div>

        <div className="static-section">
          <h3>Purchases</h3>
          <p>Digital products may be non‑refundable once revealed or redeemed. Fraudulent activity is prohibited.</p>
        </div>

        <div className="static-section">
          <h3>Accounts</h3>
          <p>You are responsible for maintaining account security. We recommend enabling Two‑Factor Authentication.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;


