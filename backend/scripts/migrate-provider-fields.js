require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gamepasal');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function for Orders
const migrateOrders = async () => {
  console.log('Starting Order migration...');
  
  try {
    // Find orders with legacy provider fields or payment methods
    const legacyOrders = await Order.find({
      $or: [
        { paymentMethod: { $in: ['eSewa', 'Khalti'] } },
        { gateway: { $in: ['ESEWA', 'KHALTI'] } },
        { 'paymentDetails.provider': { $exists: false } }
      ]
    });

    console.log(`Found ${legacyOrders.length} orders to migrate`);

    let migratedCount = 0;
    for (const order of legacyOrders) {
      let updated = false;

      // Update paymentMethod enum values
      if (order.paymentMethod === 'eSewa' || order.paymentMethod === 'Khalti') {
        order.paymentMethod = 'fonepay_qr';
        updated = true;
      }

      // Update paymentStatus enum values
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'verified';
        updated = true;
      } else if (order.paymentStatus === 'failed') {
        order.paymentStatus = 'rejected';
        updated = true;
      } else if (order.paymentStatus === 'refunded') {
        order.paymentStatus = 'rejected';
        updated = true;
      } else if (order.paymentStatus === 'cancelled') {
        order.paymentStatus = 'expired';
        updated = true;
      }

      // Update gateway enum values
      if (order.gateway === 'ESEWA' || order.gateway === 'KHALTI') {
        order.gateway = 'FONEPAY';
        updated = true;
      }

      // Add provider field to paymentDetails if missing
      if (!order.paymentDetails.provider) {
        order.paymentDetails = order.paymentDetails || {};
        order.paymentDetails.provider = 'fonepay_qr';
        updated = true;
      }

      // Add externalRef if missing but we have gatewayRef
      if (!order.paymentDetails.externalRef && order.gatewayRef) {
        order.paymentDetails.externalRef = order.gatewayRef;
        updated = true;
      }

      if (updated) {
        await order.save();
        migratedCount++;
        console.log(`Migrated order ${order.orderCode || order.orderNumber}`);
      }
    }

    console.log(`Order migration complete. ${migratedCount} orders updated.`);
  } catch (error) {
    console.error('Error during Order migration:', error);
  }
};

// Migration function for WalletTransactions
const migrateWalletTransactions = async () => {
  console.log('Starting WalletTransaction migration...');
  
  try {
    // Find wallet transactions with legacy provider fields
    const legacyTransactions = await WalletTransaction.find({
      $or: [
        { method: { $in: ['ESEWA_QR', 'ESEWA_GATEWAY', 'KHALTI_GATEWAY'] } },
        { provider: { $in: ['ESEWA_QR', 'ESEWA', 'KHALTI'] } },
        { gateway: { $in: ['ESEWA', 'KHALTI'] } },
        { status: { $in: ['PENDING', 'UNDER_REVIEW', 'AUTHORIZED', 'SUCCESS', 'REJECTED', 'DELETED', 'FAILED', 'RELEASED'] } }
      ]
    });

    console.log(`Found ${legacyTransactions.length} wallet transactions to migrate`);

    let migratedCount = 0;
    for (const transaction of legacyTransactions) {
      let updated = false;

      // Update method enum values
      if (transaction.method === 'ESEWA_QR') {
        transaction.method = 'FONEPAY_QR';
        updated = true;
      } else if (transaction.method === 'ESEWA_GATEWAY' || transaction.method === 'KHALTI_GATEWAY') {
        transaction.method = 'MANUAL_QR';
        updated = true;
      }

      // Update provider enum values
      if (transaction.provider === 'ESEWA_QR') {
        transaction.provider = 'fonepay_qr';
        updated = true;
      } else if (transaction.provider === 'ESEWA' || transaction.provider === 'KHALTI') {
        transaction.provider = 'manual';
        updated = true;
      }

      // Update gateway enum values
      if (transaction.gateway === 'ESEWA' || transaction.gateway === 'KHALTI') {
        transaction.gateway = 'FONEPAY';
        updated = true;
      }

      // Update status enum values
      const statusMap = {
        'PENDING': 'pending',
        'UNDER_REVIEW': 'awaiting_verification',
        'AUTHORIZED': 'verified',
        'SUCCESS': 'verified',
        'REJECTED': 'rejected',
        'DELETED': 'expired',
        'FAILED': 'rejected',
        'RELEASED': 'verified'
      };

      if (statusMap[transaction.status]) {
        transaction.status = statusMap[transaction.status];
        updated = true;
      }

      if (updated) {
        await transaction.save();
        migratedCount++;
        console.log(`Migrated wallet transaction ${transaction._id}`);
      }
    }

    console.log(`WalletTransaction migration complete. ${migratedCount} transactions updated.`);
  } catch (error) {
    console.error('Error during WalletTransaction migration:', error);
  }
};

// Main migration function
const runMigration = async () => {
  try {
    await connectDB();
    console.log('Starting provider fields migration...\n');

    await migrateOrders();
    console.log('');
    await migrateWalletTransactions();

    console.log('\nMigration completed successfully!');
    
    // Show summary
    const orderCount = await Order.countDocuments();
    const transactionCount = await WalletTransaction.countDocuments();
    
    console.log(`\nSummary:`);
    console.log(`- Total Orders: ${orderCount}`);
    console.log(`- Total Wallet Transactions: ${transactionCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB disconnected.');
    process.exit(0);
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateOrders, migrateWalletTransactions };
