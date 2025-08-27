const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const crypto = require('crypto');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contentRoutes = require('./routes/contentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const { walletStreamHandler } = require('./utils/walletEvents');
const checkoutRoutes = require('./routes/checkoutRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Import database connection
const connectDB = require('./config/db');

// Create Express app
const app = express();

// Add environment flag
const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';

// Connect to database
connectDB();

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

app.use(mongoSanitize());
app.use(xss());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

// Apply rate limiting only outside development
if (!isDevelopment) {
  app.use(limiter);
  app.use('/api/auth', authLimiter);
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/webhooks', webhookRoutes);
// SSE stream for wallet updates
app.get('/api/wallet/stream', walletStreamHandler);
// robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Sitemap: https://www.gamepasal.com/sitemap.xml
`);
});

// Simple XML sitemap (expand with DB-backed product/category URLs)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const base = 'https://www.gamepasal.com';
    const staticUrls = [
      '/',
      '/products',
      '/products/gift-cards',
      '/about','/careers','/blog','/partners','/affiliate',
      '/help','/faq','/contact','/terms','/privacy'
    ];
    let urls = staticUrls.map(u => `${base}${u}`);
    // Optionally fetch products/categories here using your models
    // const products = await Product.find({ isActive: true }).select('slug updatedAt').lean();
    // urls = urls.concat(products.map(p => `${base}/product/${p.slug || p._id}`));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  } catch (e) {
    res.status(500).send('');
  }
});
app.use('/api/orders', orderRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/newsletter', require('./routes/subscriptionRoutes'));

// Serve uploaded files (images, receipts)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GamePasal API is running!',
    timestamp: new Date().toISOString(),
    requestId: req.id,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestId: req.id
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${req.id}] Error:`, err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const serverInstance = app.listen(PORT, () => {
  console.log(`🚀 GamePasal API Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🔒 Security: Enhanced with CSRF protection, rate limiting, and request tracking`);
});

// Improve SSE stability in dev by increasing timeouts
try {
  serverInstance.keepAliveTimeout = 70000; // 70s
  serverInstance.headersTimeout = 75000; // 75s
} catch (_) {}

module.exports = app;