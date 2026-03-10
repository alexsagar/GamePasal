import React from 'react';
import PropTypes from 'prop-types';

/**
 * PaymentCard component for selectable payment method options
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the payment method
 * @param {string} props.title - Payment method title
 * @param {string} props.subtitle - Description or additional info
 * @param {React.ReactNode} props.icon - Payment method icon
 * @param {boolean} props.selected - Whether this method is currently selected
 * @param {boolean} props.disabled - Whether this method is currently disabled
 * @param {string} props.disabledReason - Tooltip text explaining why method is disabled
 * @param {Function} props.onSelect - Callback when method is selected
 */
const PaymentCard = ({
  id,
  title,
  subtitle,
  icon,
  selected,
  disabled,
  disabledReason,
  onSelect
}) => {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`
        relative p-6 rounded-2xl border-2 transition-all cursor-pointer
        ${selected ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !disabled && onSelect(id)}
      onKeyPress={(e) => !disabled && e.key === 'Enter' && onSelect(id)}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
        
        <div className="flex-grow">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${selected ? 'border-primary' : 'border-gray-300'}`}>
          {selected && (
            <div className="w-full h-full rounded-full bg-primary transform scale-75" />
          )}
        </div>
      </div>

      {selected && (
        <div className="absolute -top-2 -right-2">
          <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

PaymentCard.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  selected: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  disabledReason: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

export default PaymentCard;
