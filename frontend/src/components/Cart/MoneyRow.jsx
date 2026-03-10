import React from 'react';
import './MoneyRow.css';

/**
 * MoneyRow Component
 * Displays key-value pairs for order totals and calculations
 * 
 * Props:
 * - label: string - The label text
 * - amount: number - Amount in paisa (will be divided by 100)
 * - currency: string - Currency code (default: 'NPR')
 * - isTotal: boolean - Whether this is the grand total (larger, bold)
 * - isDiscount: boolean - Whether this is a discount (negative styling)
 */
const MoneyRow = ({ 
  label, 
  amount, 
  currency = 'NPR', 
  isTotal = false, 
  isDiscount = false 
}) => {
  const formattedAmount = (amount / 100).toFixed(2);
  const isNegative = amount < 0 || isDiscount;

  return (
    <div className={`money-row ${isTotal ? 'is-total' : ''}`}>
      <span className={`money-row-label ${isTotal ? 'is-total' : ''}`}>
        {label}
      </span>
      <span className={`money-row-amount ${isTotal ? 'is-total' : ''} ${isNegative ? 'is-discount' : ''}`}>
        {isNegative && amount > 0 ? '-' : ''}{currency} {formattedAmount}
      </span>
    </div>
  );
};

export default MoneyRow;
