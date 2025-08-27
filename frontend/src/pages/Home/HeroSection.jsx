import React from 'react';
import { SwiperSlide } from "swiper/react";

const HeroSlide = ({ slide, addToCart }) => {
  const product = slide.productId || null;
  let imageSrc = "";
  if (slide.image && slide.image.trim() !== "") {
    imageSrc = slide.image;
  } else if (product && product.image) {
    imageSrc = product.image;
  } else {
    imageSrc = "/vite.svg"; // Placeholder
  }

  return (
    <SwiperSlide key={slide._id}>
      <div className="hero-slide">
        <img 
          src={imageSrc} 
          alt={slide.title || "Hero Image"} 
          className="hero-image" 
          loading="lazy" decoding="async" 
        />
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">{slide.title || (product && product.title)}</h1>
              {slide.subtitle && <p className="hero-subtitle">{slide.subtitle}</p>}
              {(slide.price || (product && product.price)) && (
                <div className="hero-price">
                  <span className="current-price">
                    {slide.price || (product && product.price)}
                  </span>
                  {slide.originalPrice && (
                    <span className="original-price">{slide.originalPrice}</span>
                  )}
                </div>
              )}
              {product ? (
                <button
                  className="btn btn-primary hero-cta"
                  onClick={e => {
                    e.stopPropagation();
                    addToCart({ ...product, quantity: 1 });
                  }}
                >
                  {slide.buttonLabel || "Buy Now"}
                </button>
              ) : (
                (slide.buttonLabel) && (
                  <button
                    className="btn btn-primary hero-cta"
                    style={{ pointerEvents: "none", opacity: 1 }}
                    disabled
                  >
                    {slide.buttonLabel}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </SwiperSlide>
  );
};

export default HeroSlide;