import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Partners = () => {
  return (
    <div className="static-page">
      <SEO
        title="Partners | Work with GamePasal in Nepal"
        description="Partner with GamePasal to reach Nepali gamers. Distributors, publishers, and creators welcome."
        keywords="GamePasal partners, gaming distributors Nepal, publisher partnership Nepal"
        canonical="https://www.gamepasal.com/partners"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Partners</h1>
          <p className="static-subtitle">Work with us to reach more gamers</p>
        </div>

        <div className="static-section">
          <p>
            We collaborate with publishers, distributors, and creators to bring authentic digital goods to
            gamers at fair prices. If you want to partner, contact us with your catalog and terms.
          </p>
        </div>

        <div className="static-section">
          <h3>Why partner with GamePasal?</h3>
          <ul className="list">
            <li>Regional reach and localized payments</li>
            <li>Fast fulfillment and anti‑fraud checks</li>
            <li>Transparent reporting and payouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Partners;


