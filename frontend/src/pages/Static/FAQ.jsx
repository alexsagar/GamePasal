import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const FAQ = () => {
  const faqs = [
    { q: 'How fast do I receive my key?', a: 'Instantly for most items. Some orders may require manual review.' },
    { q: 'Can I get a refund?', a: 'Unused keys can be refunded per our policy. Contact support.' },
    { q: 'Do you support 2FA?', a: 'Yes. Enable Two‑Factor Authentication in your Profile → Settings.' },
  ];

  return (
    <div className="static-page">
      <SEO
        title="FAQ | GamePasal Nepal"
        description="Frequently asked questions about buying game gift cards in Nepal: delivery, refunds, and 2FA security."
        keywords="FAQ GamePasal, gift cards Nepal questions, delivery Nepal gaming"
        canonical="https://www.gamepasal.com/faq"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">FAQ</h1>
          <p className="static-subtitle">Frequently asked questions</p>
        </div>

        <div className="static-section">
          <div className="card-grid">
            {faqs.map((f, i) => (
              <div className="card" key={i}>
                <h4>{f.q}</h4>
                <p className="muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;


