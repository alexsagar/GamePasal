import React from 'react';
import './OrderStatusBadge.css';
import { normalizeOrderStatus, getOrderStatusLabel } from '../../utils/orderStatus';

const OrderStatusBadge = ({ status, paymentStatus }) => {
    if (!status) return null;

    const normalizedStatus = normalizeOrderStatus(status, paymentStatus);

    const getStatusConfig = (s) => {
        switch (s) {
            case 'order_placed':
                return { label: 'Order Placed', colorClass: 'badge-blue' };
            case 'payment_pending':
            case 'awaiting_payment':
            case 'pending':
                return { label: 'Payment Pending', colorClass: 'badge-yellow' };
            case 'payment_verified':
            case 'paid':
                return { label: 'Payment Verified', colorClass: 'badge-green' };
            case 'processing':
                return { label: 'Processing', colorClass: 'badge-purple' };
            case 'delivered':
                return { label: 'Delivered', colorClass: 'badge-teal' };
            case 'completed':
                return { label: 'Completed', colorClass: 'badge-cyan' };
            case 'cancelled':
                return { label: 'Cancelled', colorClass: 'badge-red' };
            case 'failed':
            case 'rejected':
            case 'expired':
                return { label: 'Failed', colorClass: 'badge-red' };
            case 'out_of_stock':
                return { label: 'Out of Stock', colorClass: 'badge-orange' };
            case 'refunded':
                return { label: 'Refunded', colorClass: 'badge-gray' };
            case 'awaiting_verification':
                return { label: 'Verifying Payment', colorClass: 'badge-yellow' };
            default: {
                return { label: getOrderStatusLabel(s, paymentStatus), colorClass: 'badge-gray' };
            }
        }
    };

    const { label, colorClass } = getStatusConfig(normalizedStatus);

    return (
        <span className={`order-status-badge ${colorClass}`}>
            {label}
        </span>
    );
};

export default OrderStatusBadge;
