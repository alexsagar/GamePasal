const STATUS_LABELS = {
  order_placed: 'Order Placed',
  payment_pending: 'Payment Pending',
  payment_verified: 'Payment Verified',
  processing: 'Processing',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
  out_of_stock: 'Out of Stock',
  refunded: 'Refunded'
};

const STATUS_ALIASES = {
  awaiting_payment: 'payment_pending',
  pending: 'payment_pending',
  awaiting_verification: 'payment_pending',
  paid: 'payment_verified',
  rejected: 'failed',
  expired: 'failed',
  delivered: 'delivered',
  cancelled: 'cancelled'
};

export function normalizeOrderStatus(status, paymentStatus) {
  const normalized = String(status || '').trim().toLowerCase();
  if (STATUS_LABELS[normalized]) return normalized;
  if (STATUS_ALIASES[normalized]) return STATUS_ALIASES[normalized];

  const normalizedPayment = String(paymentStatus || '').trim().toLowerCase();
  if (['verified', 'paid'].includes(normalizedPayment)) return 'payment_verified';
  if (['rejected', 'expired'].includes(normalizedPayment)) return 'failed';
  if (normalizedPayment === 'pending') return 'payment_pending';

  return 'processing';
}

export function getOrderStatusLabel(status, paymentStatus) {
  const normalized = normalizeOrderStatus(status, paymentStatus);
  return STATUS_LABELS[normalized] || 'Processing';
}
