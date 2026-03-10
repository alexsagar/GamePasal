import React from 'react';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import './CartItemRow.css';

/**
 * CartItemRow Component
 * Displays individual cart item with quantity controls and actions
 * 
 * Props:
 * - item: { _id, title, platform, priceNpr, qty, image }
 * - onQuantityChange: (itemId, newQuantity) => void
 * - onRemove: (itemId) => void
 * - onMoveToWishlist: (itemId) => void (optional)
 */
const CartItemRow = ({ 
  item, 
  onQuantityChange, 
  onRemove, 
  onMoveToWishlist 
}) => {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    onQuantityChange(item._id, newQuantity);
  };

  const handleMoveToWishlist = () => {
    if (onMoveToWishlist) {
      onMoveToWishlist(item._id);
    }
  };

  const subtotal = item.priceNpr * item.qty;

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img
          src={item.image || '/placeholder-game.jpg'}
          alt={item.title}
          onError={(e) => {
            e.target.src = '/placeholder-game.jpg';
          }}
        />
      </div>

      <div className="cart-item-content">
        <div className="cart-item-header">
          <div>
            <h3 className="cart-item-title">{item.title}</h3>
            <span className="cart-item-platform">{item.platform}</span>
          </div>
          <div className="cart-item-price">
            NPR {(item.priceNpr / 100).toFixed(2)}
          </div>
        </div>
        
        <div className="cart-item-controls">
          <div className="cart-item-quantity">
            <button
              onClick={() => handleQuantityChange(item.qty - 1)}
              disabled={item.qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span>{item.qty}</span>
            <button
              onClick={() => handleQuantityChange(item.qty + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="cart-item-actions">
            <button
              onClick={handleMoveToWishlist}
              className="cart-item-action wishlist"
              title="Move to wishlist"
              aria-label="Move to wishlist"
            >
              <Heart size={16} />
            </button>
            <button
              onClick={() => onRemove(item._id)}
              className="cart-item-action"
              title="Remove item"
              aria-label="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="cart-item-subtotal">
          Subtotal: <span>NPR {(subtotal / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;
