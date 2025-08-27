import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Affiliate = () => {
  return (
    <div className="static-page">
      <SEO
        title="Affiliate Program | Earn with GamePasal Nepal"
        description="Join GamePasal's affiliate program and earn by promoting PlayStation, Xbox, Steam, and PC gift cards in Nepal."
        keywords="GamePasal affiliate, gaming affiliate Nepal, gift card affiliate Nepal"
        canonical="https://www.gamepasal.com/affiliate"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Affiliate Program</h1>
          <p className="static-subtitle">Earn commissions by promoting GamePasal deals</p>
        </div>

        <div className="static-section">
          <h3>How it works</h3>
          <ol className="list">
            <li>Apply for the program and get your unique tracking link</li>
            <li>Share deals via your site, YouTube, or socials</li>
            <li>Earn a percentage on each qualifying sale</li>
          </ol>
        </div>

        <div className="static-section">
          <h3>Payouts</h3>
          <p className="muted">Monthly payouts with minimum threshold. Contact us for current rates.</p>
        </div>
      </div>
    </div>
  );
};

export default Affiliate;


