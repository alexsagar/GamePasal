import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2, 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Send
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription');
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section company-info">
            <div className="footer-logo">
              <Gamepad2 size={32} />
              <span>GamePasal</span>
            </div>
            <p className="footer-description">
              Your ultimate destination for digital games and gift cards. 
              Get the best deals on PC, PlayStation, Xbox, and Nintendo games.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <Facebook size={20} />
              </a>
              <a href="#" className="social-link">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* My Account Column */}
          <div className="footer-section">
            <h3 className="footer-title">My Account</h3>
            <ul className="footer-links">
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/profile/orders">Order History</Link></li>
              <li><Link to="/profile/wishlist">Wishlist</Link></li>
              <li><Link to="/profile/settings">Account Settings</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="footer-section">
            <h3 className="footer-title">Company</h3>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/blog">Our Blog</Link></li>
              <li><Link to="/partners">Partners</Link></li>
              <li><Link to="/affiliate">Affiliate Program</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="footer-section">
            <h3 className="footer-title">Resources</h3>
            <ul className="footer-links">
              <li><Link to="/help">Help & Support</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section - Full Width Below */}
        <div className="footer-newsletter-section">
          <h3 className="footer-title">Subscribe Us</h3>
          <p className="newsletter-text">
            Get the latest deals and updates delivered to your inbox.
          </p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <div className="newsletter-input-group">
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-btn">
                <Send size={18} />
              </button>
            </div>
          </form>
          
          {/* Contact Info */}
          <div className="contact-info">
            <div className="contact-item">
              <Mail size={16} />
              <span>support@gamepasal.com</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+977-1-4567890</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>Kathmandu, Nepal</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2024 GamePasal. All rights reserved.
            </p>
            <div className="payment-methods">
              <span>We Accept:</span>
              <div className="payment-icons">
                <span className="payment-icon">eSewa</span>
                <span className="payment-icon">Khalti</span>
                <span className="payment-icon">Bank Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;