import React from 'react';
import './StaticPage.css';
import SEO from '../../components/SEO';

const Blog = () => {
  return (
    <div className="static-page">
      <SEO
        title="GamePasal Blog | Guides & Deals for Nepali Gamers"
        description="Read GamePasal guides on redeeming gift cards in Nepal, monthly Steam deals, and platform tips."
        keywords="gaming blog Nepal, gift card guides Nepal, GamePasal blog"
        canonical="https://www.gamepasal.com/blog"
      />
      <div className="static-container">
        <div className="static-header">
          <h1 className="static-title">Our Blog</h1>
          <p className="static-subtitle">News, releases, and tips for gamers</p>
        </div>

        <div className="static-section">
          <div className="card">
            <h4>Coming soon</h4>
            <p className="muted">We are working on articles and guides. Check back shortly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;


