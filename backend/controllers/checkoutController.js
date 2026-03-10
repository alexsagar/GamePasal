const Order = require('../models/Order');
const Product = require('../models/Product');
const { applyOrderTransition } = require('../utils/orderStateMachine');

async function calculateCartTotals(items) {
  let totalPaisa = 0;
  const lineItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).lean();
    if (!product || !product.isActive) throw new Error('PRODUCT_NOT_AVAILABLE');

    const unitPaisa = (product.salePrice || product.price) * 100;
    const quantity = Math.max(1, parseInt(item.quantity || 1, 10));

    totalPaisa += unitPaisa * quantity;
    lineItems.push({
      productId: product._id,
      title: product.title,
      unitPaisa,
      quantity
    });
  }

  return { totalPaisa, lineItems };
}

exports.quote = async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items required' });
    }

    const { totalPaisa } = await calculateCartTotals(items);
    res.json({ success: true, data: { totalPaisa, gateway: 'ESEWA' } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to quote' });
  }
};

exports.createIntent = async (req, res) => {
  try {
    const { items, gateway, idempotencyKey, shippingAddress, notes } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items required' });
    }
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey required' });
    }
    if (gateway !== 'ESEWA') {
      return res.status(400).json({ success: false, message: 'Only eSewa checkout is supported' });
    }

    const existing = await Order.findOne({
      checkoutIdempotencyKey: idempotencyKey,
      userId: req.user.id
    }).lean();
    if (existing) {
      return res.json({
        success: true,
        data: {
          orderId: existing._id,
          alreadyExists: true,
          paid: existing.paymentStatusV2 === 'PAID'
        }
      });
    }

    const { totalPaisa, lineItems } = await calculateCartTotals(items);
    const products = lineItems.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: Math.round(item.unitPaisa / 100),
      quantity: item.quantity
    }));

    const order = new Order({
      userId: req.user.id,
      products,
      totalAmount: Math.round(totalPaisa / 100),
      paymentMethod: 'esewa',
      paymentStatus: 'pending',
      totalPaisa,
      gatewayUsedPaisa: totalPaisa,
      paymentMethodV2: 'GATEWAY',
      paymentStatusV2: 'PENDING',
      gateway: 'ESEWA',
      checkoutIdempotencyKey: idempotencyKey,
      shippingAddress,
      notes,
      status: 'order_placed',
      statusHistory: [{
        status: 'order_placed',
        updatedBy: req.user.id,
        note: 'Order created from checkout intent'
      }],
      audit: [{
        action: 'ORDER_PLACED',
        timestamp: new Date(),
        note: 'Order created, awaiting eSewa payment'
      }]
    });

    applyOrderTransition(order, 'payment_pending', {
      updatedBy: req.user.id,
      note: 'Awaiting eSewa payment'
    });

    await order.save();

    return res.json({
      success: true,
      data: {
        orderId: order._id,
        orderCode: order.orderCode || order.orderNumber,
        totalAmount: Math.round(totalPaisa / 100),
        paid: false,
        message: 'Order created, proceed to eSewa payment'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create intent' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId required' });
    }

    const order = await Order.findById(orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (String(order.userId) !== String(req.user.id)) throw new Error('FORBIDDEN');
    if (order.paymentStatusV2 === 'PAID') throw new Error('ALREADY_PAID');

    applyOrderTransition(order, 'cancelled', {
      updatedBy: req.user.id,
      note: 'eSewa checkout cancelled by user'
    });
    await order.save();

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to cancel checkout' });
  }
};
