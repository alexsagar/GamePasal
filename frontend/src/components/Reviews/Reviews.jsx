import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import api from '../../services/api';
import './Reviews.css';

/**
 * Review type
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} quote
 * @property {string} name
 * @property {number} rating
 * @property {string=} avatarUrl
 */

const DEFAULT_REVIEWS = [
  { id: 'r1', quote: 'Quick delivery and authentic keys. Highly recommended!', name: 'Sujan', rating: 5 },
  { id: 'r2', quote: 'Best prices on PlayStation and Xbox games. Great support!', name: 'Aarav', rating: 5 },
  { id: 'r3', quote: 'Smooth checkout and instant email delivery for software.', name: 'Aashma', rating: 5 },
  { id: 'r4', quote: 'Reliable and fast — my go-to for subscriptions.', name: 'Nabin', rating: 5 },
  { id: 'r5', quote: 'Fantastic service. Everything worked perfectly!', name: 'Shristi', rating: 5 },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(!!mql.matches);
    apply();
    const handler = (e) => setReduced(!!e.matches);
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, []);
  return reduced;
}

/**
 * Reviews carousel and header
 * @param {{
 *  reviews?: Review[],
 *  trustpilotUrl?: string,
 *  fetchFromApi?: boolean,
 *  limit?: number,
 *  className?: string,
 * }} props
 */
const Reviews = ({
  reviews: reviewsProp,
  trustpilotUrl = 'https://www.trustpilot.com/',
  fetchFromApi = true,
  limit = 24,
  className = '',
}) => {
  const [reviews, setReviews] = useState(reviewsProp && reviewsProp.length ? reviewsProp : []);
  const [loading, setLoading] = useState(fetchFromApi && !(reviewsProp && reviewsProp.length));
  const [error, setError] = useState(null);
  const reducedMotion = usePrefersReducedMotion();
  const swiperRef = useRef(null);

  // Fetch from API with fallback to defaults
  useEffect(() => {
    let cancelled = false;
    async function fetchReviews() {
      if (!fetchFromApi || (reviewsProp && reviewsProp.length)) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/reviews', { params: { limit } });
        const data = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        if (!cancelled) setReviews((data && data.length) ? data : DEFAULT_REVIEWS);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load reviews');
          setReviews(DEFAULT_REVIEWS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReviews();
    return () => { cancelled = true; };
  }, [fetchFromApi, limit, reviewsProp]);

  // Pause autoplay when tab hidden; resume on visible (if not reduced motion)
  useEffect(() => {
    const onVis = () => {
      const swiper = swiperRef.current;
      if (!swiper || !swiper.autoplay) return;
      if (document.hidden) swiper.autoplay.stop();
      else if (!reducedMotion) swiper.autoplay.start();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reducedMotion]);

  const slides = useMemo(() => (reviews && reviews.length ? reviews : DEFAULT_REVIEWS), [reviews]);

  const autoplay = reducedMotion ? false : { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true };

  return (
    <section className={`reviews-section ${className}`} role="region" aria-roledescription="carousel" aria-label="Customer reviews">
      <div className="reviews-header">
        <div className="reviews-stars" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={20} fill="#ff4757" color="#ff4757" />
          ))}
        </div>
        <h2 className="reviews-title">
          GamePasal is your one-stop shop for affordable PC, PlayStation, Xbox, and Switch games, premium software, and subscriptions
        </h2>
        <div className="reviews-cta">
          <a href={trustpilotUrl} target="_blank" rel="noopener noreferrer" className="reviews-pill" aria-label="Read 1000+ reviews on Trustpilot">
            1000+ reviews
          </a>
          <a href={trustpilotUrl} target="_blank" rel="noopener noreferrer" className="reviews-trustpilot">Trustpilot</a>
        </div>
      </div>

      {loading ? (
        <div className="reviews-skeleton-row" aria-live="polite" aria-busy="true">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="review-card skeleton" />
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Autoplay, Pagination, A11y]}
          loop
          autoplay={autoplay}
          spaceBetween={18}
          // Force 2 cards per view on mobile by default
          slidesPerView={2}
          pagination={{ clickable: true, renderBullet: (index, className) => `<button class=\"${className}\" aria-label=\"Go to testimonial ${index + 1}\"></button>` }}
          a11y={{ enabled: true }}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 18 },
            1440: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="reviews-swiper"
        >
          {slides.map((r, idx) => (
            <SwiperSlide key={r.id || idx} role="group" aria-label={`Testimonial ${idx + 1} of ${slides.length}`} className="review-slide">
              <article className="review-card">
                <p className="review-quote">{r.quote}</p>
                <div className="review-footer">
                  <div className="review-user">
                    {r.avatarUrl ? (
                      <img className="avatar" src={r.avatarUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                    ) : (
                      <div className="avatar fallback" aria-hidden="true">{(r.name || '?').slice(0, 2).toUpperCase()}</div>
                    )}
                    <div className="user-meta">
                      <span className="user-name">{r.name}</span>
                      <div className="user-stars" aria-label={`${r.rating || 5} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={16} fill="#ff4757" color="#ff4757" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};

export default Reviews; 