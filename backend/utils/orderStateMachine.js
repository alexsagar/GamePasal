const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'failed', 'out_of_stock', 'refunded']);

const STATUS_ALIASES = {
  awaiting_payment: 'payment_pending',
  awaiting_verification: 'payment_pending',
  paid: 'payment_verified',
  rejected: 'failed',
  cancelled: 'cancelled',
  delivered: 'delivered'
};

const VALID_STATUSES = new Set([
  'order_placed',
  'payment_pending',
  'payment_verified',
  'processing',
  'delivered',
  'completed',
  'cancelled',
  'failed',
  'out_of_stock',
  'refunded'
]);

const TRANSITIONS = {
  order_placed: new Set(['payment_pending', 'payment_verified', 'cancelled', 'failed', 'out_of_stock']),
  payment_pending: new Set(['payment_verified', 'cancelled', 'failed', 'out_of_stock']),
  payment_verified: new Set(['processing', 'delivered', 'refunded', 'cancelled', 'out_of_stock']),
  processing: new Set(['delivered', 'failed', 'out_of_stock', 'refunded']),
  delivered: new Set(['completed', 'refunded']),
  completed: new Set(['refunded']),
  cancelled: new Set([]),
  failed: new Set([]),
  out_of_stock: new Set([]),
  refunded: new Set([])
};

function normalizeOrderStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'order_placed';
  return STATUS_ALIASES[normalized] || normalized;
}

function getStatusFilterValues(status) {
  const normalized = normalizeOrderStatus(status);
  const values = new Set([normalized]);

  Object.entries(STATUS_ALIASES).forEach(([alias, canonical]) => {
    if (canonical === normalized) {
      values.add(alias);
      values.add(alias.toUpperCase());
    }
  });

  values.add(normalized.toUpperCase());
  return [...values];
}

function isPaidLikeStatus(status) {
  const normalized = normalizeOrderStatus(status);
  return normalized === 'payment_verified' || normalized === 'processing' || normalized === 'delivered' || normalized === 'completed' || normalized === 'refunded';
}

function getNormalizedPaymentStatus(order) {
  const paymentStatus = String(order.paymentStatus || '').trim().toLowerCase();
  const paymentStatusV2 = String(order.paymentStatusV2 || '').trim().toUpperCase();

  if (paymentStatusV2 === 'PAID') return 'verified';
  if (paymentStatusV2 === 'REFUNDED') return 'refunded';
  if (paymentStatusV2 === 'FAILED') return 'rejected';
  if (paymentStatusV2 === 'CANCELLED') return 'expired';

  if (paymentStatus === 'paid') return 'verified';
  return paymentStatus || 'pending';
}

function syncPaymentState(order, nextStatus) {
  const normalized = normalizeOrderStatus(nextStatus);

  if (normalized === 'payment_verified' || normalized === 'processing' || normalized === 'delivered' || normalized === 'completed') {
    order.paymentStatus = 'verified';
    order.paymentStatusV2 = order.paymentStatusV2 === 'REFUNDED' ? 'REFUNDED' : 'PAID';
  } else if (normalized === 'payment_pending' || normalized === 'order_placed') {
    order.paymentStatus = 'pending';
    order.paymentStatusV2 = 'PENDING';
  } else if (normalized === 'failed') {
    order.paymentStatus = 'rejected';
    order.paymentStatusV2 = 'FAILED';
  } else if (normalized === 'cancelled') {
    order.paymentStatus = 'expired';
    order.paymentStatusV2 = 'CANCELLED';
  } else if (normalized === 'out_of_stock') {
    order.paymentStatus = 'verified';
    order.paymentStatusV2 = order.paymentStatusV2 === 'REFUNDED' ? 'REFUNDED' : 'PAID';
  } else if (normalized === 'refunded') {
    order.paymentStatus = 'rejected';
    order.paymentStatusV2 = 'REFUNDED';
  }
}

function ensureDeliveryPrerequisites(order, deliveryRecordsCount = 0) {
  const orderedCount = Array.isArray(order.products) ? order.products.length : 0;
  if (orderedCount === 0) {
    throw new Error('Order has no products to deliver');
  }

  if (deliveryRecordsCount < orderedCount) {
    throw new Error('Delivery details must exist for every ordered product before marking delivered');
  }
}

function canTransition(currentStatus, nextStatus) {
  const current = normalizeOrderStatus(currentStatus);
  const next = normalizeOrderStatus(nextStatus);

  if (!VALID_STATUSES.has(next)) {
    return { ok: false, message: `Unsupported order status: ${nextStatus}` };
  }

  if (current === next) {
    return { ok: true };
  }

  if (!VALID_STATUSES.has(current)) {
    return { ok: false, message: `Unsupported current order status: ${currentStatus}` };
  }

  if (TERMINAL_STATUSES.has(current) && current !== 'completed') {
    return { ok: false, message: `Cannot transition from terminal state ${current}` };
  }

  if (!TRANSITIONS[current].has(next)) {
    return { ok: false, message: `Invalid transition from ${current} to ${next}` };
  }

  return { ok: true };
}

function applyOrderTransition(order, nextStatus, options = {}) {
  const current = normalizeOrderStatus(order.status);
  const next = normalizeOrderStatus(nextStatus);
  const transitionCheck = canTransition(current, next);

  if (!transitionCheck.ok) {
    throw new Error(transitionCheck.message);
  }

  if (next === 'delivered') {
    if (!isPaidLikeStatus(current)) {
      throw new Error('Delivered status requires a paid order');
    }
    ensureDeliveryPrerequisites(order, options.deliveryRecordsCount || 0);
    order.deliveryDetails = {
      ...(order.deliveryDetails || {}),
      deliveredAt: options.deliveredAt || new Date()
    };
  }

  if (next === 'completed' && current !== 'delivered') {
    throw new Error('Completed status requires the order to be delivered first');
  }

  if (next === 'processing' && !isPaidLikeStatus(current)) {
    throw new Error('Processing status requires payment verification first');
  }

  order.status = next;
  syncPaymentState(order, next);

  order.statusHistory.push({
    status: next,
    updatedBy: options.updatedBy,
    note: options.note || `Status updated to ${next}`,
    updatedAt: options.updatedAt || new Date()
  });

  if (!Array.isArray(order.audit)) {
    order.audit = [];
  }

  order.audit.push({
    action: `STATUS_${next.toUpperCase()}`,
    timestamp: options.updatedAt || new Date(),
    note: options.note || `Status updated to ${next}`,
    reviewer: options.reviewer
  });

  return next;
}

module.exports = {
  VALID_STATUSES,
  normalizeOrderStatus,
  getStatusFilterValues,
  getNormalizedPaymentStatus,
  canTransition,
  applyOrderTransition,
  ensureDeliveryPrerequisites,
  isPaidLikeStatus
};
