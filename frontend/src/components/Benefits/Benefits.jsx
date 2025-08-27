import React from 'react';
import * as Icons from 'lucide-react';
import './Benefits.css';
import { defaultBenefits } from './benefits.config';

/**
 * @typedef {Object} Benefit
 * @property {string} id
 * @property {string} icon // lucide-react icon name
 * @property {string} title
 * @property {string} description
 */

/**
 * @param {{
 *  title?: string,
 *  subtitle?: string,
 *  items?: Benefit[],
 *  ctaLabel?: string,
 *  ctaHref?: string,
 *  className?: string,
 * }} props
 */
const Benefits = ({
  title = 'Why Choose Us',
  subtitle = 'We deliver more than just games and software — we deliver value you can trust.',
  items = defaultBenefits,
  ctaLabel,
  ctaHref,
  className = '',
}) => {
  return (
    <section className={`benefits-section ${className}`} aria-label="Key benefits">
      <div className="container">
        <header className="benefits-header">
          <h2 className="benefits-title">{title}</h2>
          {subtitle && <p className="benefits-subtitle">{subtitle}</p>}
        </header>

        <ul className="benefits-grid" role="list">
          {items.map((b) => {
            const Icon = Icons[b.icon] || Icons.Zap;
            return (
              <li key={b.id} className="benefit-card">
                <div className="benefit-icon" aria-hidden="true">
                  <Icon size={28} color="#ff4757" />
                </div>
                <div className="benefit-content">
                  <h3 className="benefit-title">{b.title}</h3>
                  <p className="benefit-desc">{b.description}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {ctaLabel && ctaHref && (
          <div className="benefits-cta">
            <a className="benefits-btn" href={ctaHref}>{ctaLabel}</a>
          </div>
        )}
      </div>
    </section>
  );
};

export default Benefits; 