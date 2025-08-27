import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Help = () => {
  return (
    <div className="static-page">
      <SEO
        title="Help & Support | GamePasal Nepal"
        description="Get help with orders, gift card redemption, and payments in Nepal. Contact GamePasal support."
        keywords="GamePasal support, redeem gift cards Nepal, help Nepal gaming"
        canonical="https://www.gamepasal.com/help"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Help & Support</h1>
          <p className="static-subtitle">Find answers and get in touch</p>
        </div>

        <div className="static-section">
          <h3>Common topics</h3>
          <ul className="list">
            <li>Where is my key? Check your order history and email</li>
            <li>Key not working? Contact support with screenshots</li>
            <li>Refunds and cancellations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;


