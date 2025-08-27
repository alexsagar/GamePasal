const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);

    // Attempt to create default data
    try {
      await createDefaultData();
    } catch (err) {
      console.error('🔥 Error during createDefaultData:', err);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const createDefaultData = async () => {
  try {
    const User = require('../models/User');
    const Content = require('../models/Content');
    const Product = require('../models/Product');

    // Default Admin
    try {
      const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminExists) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

        await User.create({
          username: 'Admin',
          email: process.env.ADMIN_EMAIL,
          phone: '+977-9800000000',
          password: hashedPassword,
          role: 'admin',
          isVerified: true
        });

        console.log('✅ Default admin user created');
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    } catch (err) {
      console.error('❌ Error creating admin user:', err.message);
    }

    // Default Hero Content
    try {
      const heroContent = await Content.findOne({ section: 'hero' });
      if (!heroContent) {
        await Content.create({
          section: 'hero',
          title: 'Tom Clancy\'s Rainbow Six Siege The Divisions',
          subtitle: 'Experience the ultimate tactical shooter',
          description: 'Get the best gaming experience with our premium collection',
          image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1200',
          data: {
            price: 'Nrs 79.99',
            originalPrice: 'Nrs 99.99',
            cta: 'Buy Now'
          }
        });

        console.log('✅ Default hero content created');
      } else {
        console.log('ℹ️ Hero content already exists');
      }
    } catch (err) {
      console.error('❌ Error creating hero content:', err.message);
    }

    // Sample Products
    try {
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        const sampleProducts = [
          {
            title: 'The Witcher 3: Wild Hunt',
            category: 'Game',
            platform: 'PC',
            description: 'An epic open-world RPG adventure',
            price: 39.99,
            salePrice: 19.99,
            stock: 100,
            image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400',
            genre: 'RPG',
            rating: 4.9,
            badge: 'SALE'
          },
          {
            title: 'Cyberpunk 2077',
            category: 'Game',
            platform: 'PC',
            description: 'A futuristic open-world action RPG',
            price: 59.99,
            salePrice: 29.99,
            stock: 50,
            image: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400',
            genre: 'Action',
            rating: 4.2,
            badge: 'SALE'
          },
          {
            title: 'Steam Gift Card $50',
            category: 'GiftCard',
            platform: 'Steam',
            description: 'Steam digital gift card for games and content',
            price: 50.00,
            stock: 1000,
            image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400',
            type: 'gift-card'
          },
          {
            title: 'Xbox Game Pass Ultimate',
            category: 'GiftCard',
            platform: 'Xbox',
            description: 'Access to hundreds of games',
            price: 14.99,
            stock: 500,
            image: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400',
            type: 'subscription'
          }
        ];

        await Product.insertMany(sampleProducts);
        console.log('✅ Sample products created');
      } else {
        console.log('ℹ️ Sample products already exist');
      }
    } catch (err) {
      console.error('❌ Error inserting sample products:', err.message);
    }

  } catch (outerErr) {
    console.error('❌ Unexpected error during createDefaultData:', outerErr.message);
  }
};

module.exports = connectDB;
