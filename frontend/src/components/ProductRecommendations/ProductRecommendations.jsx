import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ProductRecommendations.css';

const RAW_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ROOT = (RAW_ROOT || '').replace(/\/$/, '');

const getImageSrc = (img) =>
  img
    ? img.startsWith('http')
      ? img
      : `${ROOT}/uploads/${img}`
    : '';

const ProductRecommendations = ({ title = 'Recommended for You', products = [] }) => {
  const navigate = useNavigate();

  if (!products.length) {
    return null;
  }

  return (
    <div className="related-products">
      <h2>{title}</h2>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={24}
        slidesPerView={3}
        pagination={{ clickable: true }}
        breakpoints={{
          1024: { slidesPerView: 3 },
          768: { slidesPerView: 2 },
          480: { slidesPerView: 1 }
        }}
        style={{ padding: '10px 0 30px 0' }}
      >
        {products.map((product) => (
          <SwiperSlide key={product._id}>
            <div
              className="related-product-card"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <img src={getImageSrc(product.image)} alt={product.title} loading="lazy" decoding="async" />
              <div className="related-product-info">
                <div className="related-product-meta">
                  <span>{product.category}</span>
                  {product.platform && <span>{product.platform}</span>}
                </div>
                <h4>{product.title}</h4>
                {product.recommendationReason && (
                  <p className="related-product-reason">{product.recommendationReason}</p>
                )}
                <div className="related-product-price1">
                  {product.salePrice ? (
                    <>
                      <span className="current">NRS {product.salePrice}</span>
                      <span className="original">NRS {product.price}</span>
                    </>
                  ) : (
                    <span className="current">NRS {product.price}</span>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductRecommendations;
