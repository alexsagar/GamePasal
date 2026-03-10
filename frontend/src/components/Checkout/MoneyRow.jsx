import React from 'react';
import PropTypes from 'prop-types';

/**
 * MoneyRow component for displaying key-value price information
 * @param {Object} props
 * @param {string} props.label - Label for the price row
 * @param {number} props.amount - Amount in NPR
 * @param {string} props.type - Visual style: 'regular' | 'total' | 'discount'
 * @param {React.ReactNode} props.info - Optional helper text/icon
 */
const MoneyRow = ({ label, amount, type = 'regular', info }) => {
  const styles = {
    regular: 'text-gray-600',
    total: 'text-lg font-medium text-gray-900',
    discount: 'text-green-600'
  };

  return (
    <div className={`flex items-center justify-between py-2 ${type === 'total' ? 'border-t border-gray-200 mt-2' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={styles[type]}>{label}</span>
        {info && (
          <span className="text-gray-400 hover:text-gray-600 cursor-help" title={typeof info === 'string' ? info : undefined}>
            {typeof info === 'string' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : info}
          </span>
        )}
      </div>
      <span className={`${styles[type]} tabular-nums`}>
        NPR {amount.toLocaleString()}
      </span>
    </div>
  );
};

MoneyRow.propTypes = {
  label: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['regular', 'total', 'discount']),
  info: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};

export default MoneyRow;
