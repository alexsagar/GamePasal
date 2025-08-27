const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmation } = require('../utils/sendOTP');

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

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order
    const orderData = {
      userId: req.user.id,
      products: orderProducts,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'Pending',
      shippingAddress,
      promoCode
    };

    const order = await Order.create(orderData);

    // Populate order with user details
    await order.populate('userId', 'username email phone');

    // Send order confirmation email
    try {
      await sendOrderConfirmation(req.user.email, {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus
      });
    } catch (emailError) {
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
    if (status) filter.status = status;
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

    // Update fields if provided
    if (status) {
      order.status = status;
      order.statusHistory.push({
        status,
        updatedBy: req.user.id,
        note: adminNotes || `Status updated to ${status}`
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && paymentDetails) {
        order.paymentDetails = {
          ...order.paymentDetails,
          ...paymentDetails,
          paymentDate: new Date()
        };
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
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    // Restore product stock
    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
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
    if (order.status === 'delivered' || order.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed orders'
      });
    }

    // Restore product stock if order was processing
    if (order.status === 'processing' || order.status === 'pending') {
      for (const item of order.products) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
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
  const User = require('../models/User');
  const WalletTransaction = require('../models/WalletTransaction');
  const { notifyWalletUpdate } = require('../utils/walletEvents');
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    let balanceAfter;
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error('Order not found');
      if (order.paymentStatusV2 !== 'PAID') throw new Error('Order is not paid');

      // Refund wallet portion if used
      if (order.walletUsedPaisa && order.walletUsedPaisa > 0) {
        const user = await User.findById(order.userId).session(session);
        const newBalance = (user.walletBalance || 0) + order.walletUsedPaisa;
        await WalletTransaction.create([{
          user: order.userId,
          type: 'REFUND',
          method: 'CHECKOUT',
          provider: 'CHECKOUT',
          amount: order.walletUsedPaisa,
          status: 'SUCCESS',
          orderId: order._id,
          referenceNote: 'Refund wallet portion',
          balanceAfter: newBalance
        }], { session });
        user.walletBalance = newBalance;
        await user.save({ session });
        balanceAfter = newBalance;
      }

      // TODO: trigger gateway refund for gatewayUsedPaisa if > 0
      order.paymentStatusV2 = 'REFUNDED';
      await order.save({ session });
    });
    if (typeof balanceAfter === 'number') {
      const order = await Order.findById(req.params.id).lean();
      notifyWalletUpdate(order.userId, balanceAfter);
    }
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
  refundOrder
};