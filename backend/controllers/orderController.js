const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderProcessingEmail, sendOrderDeliveryEmail, sendOrderEmail } = require('../services/mailer');
const Delivery = require('../models/Delivery');
const {
  applyOrderTransition,
  normalizeOrderStatus,
  getStatusFilterValues,
  getNormalizedPaymentStatus,
  isPaidLikeStatus
} = require('../utils/orderStateMachine');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { products, paymentMethod, shippingAddress, promoCode } = req.body;

    // Validate products and calculate total
    let calculatedTotal = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}`
        });
      }

      const price = product.salePrice || product.price;
      calculatedTotal += price * item.quantity;

      orderProducts.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        salePrice: product.salePrice,
        quantity: item.quantity,
        image: product.image
      });

    }

    // Generate order number with timestamp to avoid race conditions
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}${random}`;

    // Create order
    const orderData = {
      userId: req.user?.id, // Optional for guest checkout
      orderNumber,
      products: orderProducts,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'Pending',
      shippingAddress,
      promoCode,
      guestEmail: req.body.guestEmail,
      status: 'order_placed',
      statusHistory: [{
        status: 'order_placed',
        updatedBy: req.user?.id,
        note: 'Order created'
      }]
    };

    const order = await Order.create(orderData);

    // Populate order with user details
    await order.populate('userId', 'username email phone');

    // Send order confirmation email (branded)
    try { await sendOrderEmail(order); } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
};

// @desc    Send manual delivery email and optionally mark delivered
// @route   POST /api/orders/:id/deliver
// @access  Private/Admin
const deliverOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], adminNotes } = req.body;
    const order = await Order.findById(id).populate('userId', 'email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const normalizedStatus = normalizeOrderStatus(order.status);
    if (!isPaidLikeStatus(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Order must be payment verified before delivery' });
    }

    if (!Array.isArray(items) || items.length !== order.products.length) {
      return res.status(400).json({ success: false, message: 'Delivery details are required for every ordered product' });
    }

    for (const productLine of order.products) {
      const payload = items.find((item) => String(item.productId) === String(productLine.productId));
      if (!payload) {
        return res.status(400).json({ success: false, message: `Missing delivery data for ${productLine.title}` });
      }

      if (!payload.delivery_type) {
        return res.status(400).json({ success: false, message: `Delivery type is required for ${productLine.title}` });
      }

      if (payload.delivery_type === 'game_login_details') {
        if (!payload.login_email || !payload.login_password) {
          return res.status(400).json({ success: false, message: `Login email and password are required for ${productLine.title}` });
        }
      } else if (!payload.redeem_code) {
        return res.status(400).json({ success: false, message: `Redeem code is required for ${productLine.title}` });
      }
    }

    for (const item of items) {
      await Delivery.findOneAndUpdate(
        { orderId: order._id, productId: item.productId },
        {
          orderId: order._id,
          productId: item.productId,
          delivery_type: item.delivery_type,
          redeem_code: item.redeem_code,
          login_email: item.login_email,
          login_password: item.login_password,
          instructions: item.instructions,
          sent_by_admin: req.user.id,
          sent_at: new Date()
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    const deliveryCount = await Delivery.countDocuments({ orderId: order._id });

    // Send email combining items into a string format the mailer understands
    await sendOrderDeliveryEmail(order.userId, order, { items });

    if (normalizedStatus === 'payment_verified') {
      applyOrderTransition(order, 'processing', {
        updatedBy: req.user.id,
        note: adminNotes || 'Admin started manual fulfillment'
      });
    }

    applyOrderTransition(order, 'delivered', {
      updatedBy: req.user.id,
      note: adminNotes || 'Order officially marked as delivered',
      deliveryRecordsCount: deliveryCount
    });
    await order.save();

    res.json({ success: true, message: 'Order delivered successfully' });
  } catch (e) {
    console.error('deliverOrder error:', e);
    res.status(500).json({ success: false, message: 'Failed to deliver order' });
  }
};

// @desc    Get secure decrypted delivery details for a specific order
// @route   GET /api/orders/:id/delivery
// @access  Private
const getOrderDeliveryDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Ensure authorized user (owner or admin)
    if (String(order.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Make sure delivery is actually complete before revealing
    if (!['delivered', 'completed'].includes(normalizeOrderStatus(order.status))) {
      return res.status(400).json({ success: false, message: 'Order is not yet delivered' });
    }

    const deliveries = await Delivery.find({ orderId: order._id })
      .select('productId delivery_type redeem_code login_email login_password instructions sent_at');

    // Mongoose will automatically decrypt the getters since we set toJSON: { getters: true } in the schema
    res.json({ success: true, data: deliveries });

  } catch (error) {
    console.error('getDeliveryDetails error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching delivery details' });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/user
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('products.productId', 'title image');

    const total = await Order.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: orders
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'username email phone')
      .populate('products.productId', 'title image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = { $in: getStatusFilterValues(status) };
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username email phone')
      .populate('products.productId', 'title image');

    const total = await Order.countDocuments(filter);

    // Calculate statistics
    const stats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      stats: stats[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 },
      data: orders
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, adminNotes, paymentDetails } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const normalizedCurrentStatus = normalizeOrderStatus(order.status);

    if (status) {
      const deliveryRecordsCount = ['delivered', 'completed'].includes(normalizeOrderStatus(status))
        ? await Delivery.countDocuments({ orderId: order._id })
        : 0;

      applyOrderTransition(order, status, {
        updatedBy: req.user.id,
        note: adminNotes || `Status updated to ${normalizeOrderStatus(status)}`,
        deliveryRecordsCount
      });

      if (normalizeOrderStatus(status) === 'processing' && normalizedCurrentStatus !== 'processing') {
        try { await sendOrderProcessingEmail(order.userId, order); } catch (_) { }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (['paid', 'verified'].includes(paymentStatus) && paymentDetails) {
        order.paymentDetails = {
          ...order.paymentDetails,
          ...paymentDetails,
          paymentDate: new Date()
        };
      }

      if (paymentStatus === 'verified' && ['order_placed', 'payment_pending'].includes(normalizeOrderStatus(order.status))) {
        applyOrderTransition(order, 'payment_verified', {
          updatedBy: req.user.id,
          note: adminNotes || 'Payment manually verified by admin'
        });
      }
      if (paymentStatus === 'rejected' && ['order_placed', 'payment_pending', 'processing'].includes(normalizeOrderStatus(order.status))) {
        applyOrderTransition(order, 'failed', {
          updatedBy: req.user.id,
          note: adminNotes || 'Payment rejected by admin'
        });
      }
    }

    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    await order.save();

    // Populate for response
    await order.populate('userId', 'username email phone');

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update order error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating order'
    });
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (!['order_placed', 'payment_pending'].includes(normalizeOrderStatus(order.status))) {
      return res.status(400).json({
        success: false,
        message: 'Only unpaid orders can be cancelled'
      });
    }

    applyOrderTransition(order, 'cancelled', {
      updatedBy: req.user.id,
      note: 'Order cancelled by user'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order'
    });
  }
};

// @desc    Delete order permanently
// @route   DELETE /api/orders/:id/delete
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be deleted (only pending, cancelled, or failed payment orders)
    if (['delivered', 'completed'].includes(normalizeOrderStatus(order.status))) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed orders'
      });
    }

    // Delete the order permanently
    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting order'
    });
  }
};

// @desc    Refund order (Admin)
// @route   POST /api/orders/:id/refund
// @access  Private/Admin
const refundOrder = async (req, res) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error('Order not found');
      if (getNormalizedPaymentStatus(order) !== 'verified') throw new Error('Order is not paid');

      // TODO: trigger gateway refund
      applyOrderTransition(order, 'refunded', {
        updatedBy: req.user.id,
        note: 'Order refunded by admin'
      });
      await order.save({ session });
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Refund failed' });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  refundOrder,
  deliverOrder,
  getOrderDeliveryDetails
};
