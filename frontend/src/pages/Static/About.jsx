import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const About = () => {
  return (
    <div className="static-page">
      <SEO
        title="About GamePasal | Game & Gift Cards in Nepal"
        description="GamePasal is Nepal's trusted marketplace for PlayStation, Xbox, Steam, and PC gift cards with instant delivery."
        keywords="GamePasal, about GamePasal, gift cards Nepal, game store Nepal"
        canonical="https://www.gamepasal.com/about"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">About GamePasal</h1>
          <p className="static-subtitle">Your trusted marketplace for digital games and gift cards</p>
        </div>

        <div className="static-section">
          <p>
            GamePasal connects gamers with the best prices on PC, PlayStation, Xbox, and Nintendo titles,
            along with popular gift cards and subscriptions. We focus on fast delivery, secure checkout,
            and helpful support.
          </p>
        </div>

        <div className="static-section">
          <h3>What we offer</h3>
          <ul className="list">
            <li>Instant delivery for most digital products</li>
            <li>Verified keys sourced from trusted partners</li>
            <li>Secure payments with local wallets and bank transfer</li>
            <li>Account area for order history and 2FA-enabled security</li>
          </ul>
        </div>

        <div className="static-section">
          <h3>Our values</h3>
          <div className="card-grid">
            <div className="card">
              <h4>Customer-first</h4>
              <p className="muted">We prioritize reliable service and responsive support.</p>
            </div>
            <div className="card">
              <h4>Fair pricing</h4>
              <p className="muted">We continuously scout deals and pass the savings to you.</p>
            </div>
            <div className="card">
              <h4>Security</h4>
              <p className="muted">From 2FA to careful vendor vetting, we protect your purchases.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


