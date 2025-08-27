import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Privacy = () => {
  return (
    <div className="static-page">
      <SEO
        title="Privacy Policy | GamePasal Nepal"
        description="Learn how GamePasal collects and protects your data when buying game gift cards in Nepal."
        keywords="GamePasal privacy policy, data protection Nepal, privacy Nepal gaming"
        canonical="https://www.gamepasal.com/privacy"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Privacy Policy</h1>
          <p className="static-subtitle">How we collect, use, and protect your data</p>
        </div>

        <div className="static-section">
          <h3>Overview</h3>
          <p>We collect the minimal data necessary to process orders and improve the service. We never sell personal data.</p>
        </div>

        <div className="static-section">
          <h3>Security</h3>
          <p>We protect your account with industry best practices. Enable 2FA for additional security.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;


