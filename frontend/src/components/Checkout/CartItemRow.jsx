import React from 'react';
import PropTypes from 'prop-types';

/**
 * CartItemRow component displays a single item in the cart with image, details, and controls
 * @param {Object} props
 * @param {string} props._id - Item ID
 * @param {string} props.title - Game title
 * @param {string} props.platform - Gaming platform (e.g., 'PS5', 'PC')
 * @param {number} props.priceNpr - Price in NPR
 * @param {number} props.qty - Quantity
 * @param {string} props.image - Image URL
 * @param {Function} props.onUpdateQty - Callback when quantity changes
 * @param {Function} props.onRemove - Callback when item is removed
 * @param {Function} props.onMoveToWishlist - Optional callback for wishlist feature
 */
const CartItemRow = ({ 
  _id,
  title,
  platform,
  priceNpr,
  qty,
  image,
  onUpdateQty,
  onRemove,
  onMoveToWishlist
}) => {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200">
      <div className="w-20 h-20 flex-shrink-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{title}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {platform}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quantity Stepper */}
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => qty > 1 && onUpdateQty(_id, qty - 1)}
            className="px-2 py-1 text-gray-600 hover:text-primary disabled:opacity-50"
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="w-8 text-center">{qty}</span>
          <button
            onClick={() => onUpdateQty(_id, qty + 1)}
            className="px-2 py-1 text-gray-600 hover:text-primary"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Price */}
        <div className="text-right min-w-[100px]">
          <div className="font-medium">NPR {(priceNpr * qty).toLocaleString()}</div>
          {qty > 1 && (
            <div className="text-sm text-gray-500">
              NPR {priceNpr.toLocaleString()} each
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onMoveToWishlist && (
            <button
              onClick={() => onMoveToWishlist(_id)}
              className="text-gray-400 hover:text-secondary"
              aria-label="Move to wishlist"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onRemove(_id)}
            className="text-gray-400 hover:text-primary"
            aria-label="Remove item"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

CartItemRow.propTypes = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  platform: PropTypes.string.isRequired,
  priceNpr: PropTypes.number.isRequired,
  qty: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  onUpdateQty: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onMoveToWishlist: PropTypes.func
};

export default CartItemRow;
