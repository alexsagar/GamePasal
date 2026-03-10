require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

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

// Main migration function
const migrateLegacyOrders = async () => {
  try {
    console.log('Starting legacy payment provider migration...');
    
    // Find orders with legacy payment providers
    const legacyOrders = await Order.find({
      $or: [
        { gateway: { $in: ['ESEWA', 'KHALTI'] } },
        { 'payment.method': { $in: ['esewa', 'khalti'] } },
        { paymentMethodV2: 'GATEWAY', gateway: { $in: ['ESEWA', 'KHALTI'] } }
      ]
    });

    console.log(`Found ${legacyOrders.length} orders with legacy payment providers`);

    let cancelledCount = 0;
    let alreadyProcessedCount = 0;

    for (const order of legacyOrders) {
      try {
        // Skip orders that are already in final states
        if (['PAID', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
          alreadyProcessedCount++;
          continue;
        }

        // Cancel orders that are still pending/processing
        order.status = 'CANCELLED';
        
        // Add audit entry
        if (!order.audit) {
          order.audit = [];
        }
        
        order.audit.push({
          action: 'LEGACY_PROVIDER_REMOVED',
          timestamp: new Date(),
          note: `Order cancelled due to legacy payment provider removal. Gateway: ${order.gateway || 'unknown'}`,
          reviewer: 'system'
        });

        // Clear legacy payment fields
        order.gateway = null;
        order.gatewayRef = null;
        if (order.payment) {
          order.payment.method = null;
          order.payment.transactionId = null;
        }

        await order.save();
        cancelledCount++;
        
        console.log(`Cancelled order ${order.orderCode || order.orderNumber || order._id}`);
      } catch (error) {
        console.error(`Error processing order ${order._id}:`, error.message);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total legacy orders found: ${legacyOrders.length}`);
    console.log(`Orders cancelled: ${cancelledCount}`);
    console.log(`Orders already processed: ${alreadyProcessedCount}`);
    console.log(`Orders with errors: ${legacyOrders.length - cancelledCount - alreadyProcessedCount}`);

    // Show current order status distribution
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('\n=== Current Order Status Distribution ===');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`${_id}: ${count} orders`);
    });

    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await migrateLegacyOrders();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateLegacyOrders };

