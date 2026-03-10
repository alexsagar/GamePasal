const mongoose = require('mongoose');
const Product = require('../models/Product');
const { sendOrderProcessingEmail } = require('./mailer');
const { applyOrderTransition, normalizeOrderStatus } = require('../utils/orderStateMachine');

function isTransactionUnsupported(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === 20 ||
    message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
    message.includes('replica set') ||
    message.includes('does not support transactions')
  );
}

async function loadOrderForUpdate(order, session) {
  const query = order.constructor.findById(order._id);
  if (session) {
    query.session(session);
  }
  return query;
}

async function loadProductForUpdate(productId, session) {
  const query = Product.findById(productId);
  if (session) {
    query.session(session);
  }
  return query;
}

async function saveDocument(document, session) {
  if (session) {
    return document.save({ session });
  }
  return document.save();
}

async function applyPaidOrderUpdates(order, session = null) {
  const liveOrder = await loadOrderForUpdate(order, session);
  if (!liveOrder) {
    throw new Error('Order not found');
  }

  const currentStatus = normalizeOrderStatus(liveOrder.status);
  if (!['order_placed', 'payment_pending'].includes(currentStatus)) {
    Object.assign(order, liveOrder.toObject());
    return;
  }

  for (const item of liveOrder.products) {
    const product = await loadProductForUpdate(item.productId, session);

    if (!product || !product.isActive) {
      applyOrderTransition(liveOrder, 'out_of_stock', {
        updatedBy: liveOrder.userId,
        note: `Product unavailable during payment confirmation: ${item.title || item.productId}`
      });
      await saveDocument(liveOrder, session);
      Object.assign(order, liveOrder.toObject());
      return;
    }

    if (product.stock < item.quantity) {
      applyOrderTransition(liveOrder, 'out_of_stock', {
        updatedBy: liveOrder.userId,
        note: `Insufficient stock for ${product.title} during payment confirmation`
      });
      await saveDocument(liveOrder, session);
      Object.assign(order, liveOrder.toObject());
      return;
    }

    product.stock -= item.quantity;
    await saveDocument(product, session);
  }

  applyOrderTransition(liveOrder, 'payment_verified', {
    updatedBy: liveOrder.userId,
    note: 'Payment verified and stock reserved'
  });

  liveOrder.paymentDetails = {
    ...(liveOrder.paymentDetails || {}),
    paymentDate: liveOrder.paymentDetails?.paymentDate || new Date(),
    provider: liveOrder.paymentDetails?.provider || 'esewa'
  };

  await saveDocument(liveOrder, session);
  Object.assign(order, liveOrder.toObject());
}

// Handle order fulfillment after payment is confirmed
async function onOrderPaid(order) {
  const session = await mongoose.startSession();

  try {
    try {
      await session.withTransaction(async () => {
        await applyPaidOrderUpdates(order, session);
      });
    } catch (error) {
      if (!isTransactionUnsupported(error)) {
        throw error;
      }

      await applyPaidOrderUpdates(order);
    }

    if (order.userId && normalizeOrderStatus(order.status) === 'payment_verified') {
      try {
        await sendOrderProcessingEmail(order.userId, order);
      } catch (error) {
        console.error('Order processing email failed:', error);
      }
    }
  } catch (error) {
    console.error('Order fulfillment error:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  onOrderPaid
};
