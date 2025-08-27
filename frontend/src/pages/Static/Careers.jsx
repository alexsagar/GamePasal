import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Careers = () => {
  return (
    <div className="static-page">
      <SEO
        title="Careers at GamePasal | Build Gaming Commerce for Nepal"
        description="Join GamePasal to build the best way to buy game gift cards in Nepal. Remote-friendly roles in engineering, design, and partnerships."
        keywords="GamePasal careers, jobs in Nepal tech, gaming jobs Nepal"
        canonical="https://www.gamepasal.com/careers"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Careers</h1>
          <p className="static-subtitle">Join a small team building for millions of gamers</p>
        </div>

        <div className="static-section">
          <h3>Open roles</h3>
          <div className="card-grid">
            <div className="card">
              <h4>Full‑Stack Engineer</h4>
              <p className="muted">React, Node.js, MongoDB. Experience with payments a plus.</p>
            </div>
            <div className="card">
              <h4>Product Designer</h4>
              <p className="muted">Design delightful commerce and account experiences.</p>
            </div>
            <div className="card">
              <h4>Content & Partnerships</h4>
              <p className="muted">Source deals and manage publisher relationships.</p>
            </div>
          </div>
        </div>

        <div className="static-section">
          <h3>How we work</h3>
          <ul className="list">
            <li>Remote‑friendly with async communication</li>
            <li>Ownership over projects and measurable impact</li>
            <li>Customer‑obsessed culture with rapid iteration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Careers;


