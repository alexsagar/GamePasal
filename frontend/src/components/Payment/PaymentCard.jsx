import React from 'react';
import { Check } from 'lucide-react';

/**
 * PaymentCard Component
 * Large selectable tile for payment methods
 * 
 * Props:
 * - id: string - Unique identifier
 * - title: string - Payment method title
 * - subtitle: string - Description or additional info
 * - icon: React.Component - Icon component
 * - isSelected: boolean - Whether this card is selected
 * - isDisabled: boolean - Whether this card is disabled
 * - onSelect: () => void - Callback when card is selected
 * - variant: 'primary' | 'secondary' - Visual variant
 */
const PaymentCard = ({
  title,
  subtitle,
  icon: Icon,
  isSelected = false,
  isDisabled = false,
  onSelect,
  variant = 'primary'
}) => {
  const baseClasses = "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20";
  
  const variantClasses = {
    primary: {
      selected: "border-blue-500 bg-blue-50",
      unselected: "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25",
      disabled: "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
    },
    secondary: {
      selected: "border-green-500 bg-green-50",
      unselected: "border-gray-200 bg-white hover:border-green-300 hover:bg-green-25",
      disabled: "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
    }
  };

  const currentVariant = variantClasses[variant];
  
  let cardClasses = baseClasses;
  if (isDisabled) {
    cardClasses += ` ${currentVariant.disabled}`;
  } else if (isSelected) {
    cardClasses += ` ${currentVariant.selected}`;
  } else {
    cardClasses += ` ${currentVariant.unselected}`;
  }

  const iconColor = isSelected 
    ? (variant === 'primary' ? 'text-blue-600' : 'text-green-600')
    : isDisabled 
    ? 'text-gray-400' 
    : 'text-gray-600';

  const textColor = isDisabled ? 'text-gray-400' : isSelected ? 'text-gray-900' : 'text-gray-700';
  const subtitleColor = isDisabled ? 'text-gray-300' : 'text-gray-500';

  return (
    <div
      className={cardClasses}
      onClick={isDisabled ? undefined : onSelect}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            variant === 'primary' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            <Check size={14} className="text-white" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-3 rounded-xl ${
          isSelected 
            ? (variant === 'primary' ? 'bg-blue-100' : 'bg-green-100')
            : isDisabled 
            ? 'bg-gray-100' 
            : 'bg-gray-100'
        }`}>
          <Icon size={24} className={iconColor} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold mb-1 ${textColor}`}>
            {title}
          </h3>
          <p className={`text-sm leading-relaxed ${subtitleColor}`}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Disabled Tooltip */}
      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
            This payment method is not available
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCard;
