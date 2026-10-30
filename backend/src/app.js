const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routers/authRoutes');

const productRoutes = require('./routers/productRoutes');
const categoryRoutes = require('./routers/categoryRoutes');
const cartRoutes = require('./routers/cartRoutes');
const orderRoutes = require('./routers/orderRoutes');
const checkoutRoutes = require('./routers/checkoutRoutes');
const addressRoutes = require('./routers/addressRoutes');
const wishlistRoutes = require('./routers/wishlistRoutes');
const paymentRoutes = require('./routers/paymentRoutes');
const adminRoutes = require('./routers/adminRoutes');
const vendorRoutes = require('./routers/vendorRoutes');
const deliveryRoutes = require('./routers/deliveryRoutes');
const deliveryZoneRoutes = require('./routers/deliveryZoneRoutes');
const shippingRoutes = require('./routers/shippingRoutes');

const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
// Dynamic CORS supporting local development, Vercel frontend, and production env
const allowedOrigins = [
  'https://appsica-ecom-website.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

if (process.env.FRONTEND_URL) {
  const cleanFrontend = process.env.FRONTEND_URL.trim().replace(/\/+$/, '');
  if (!allowedOrigins.includes(cleanFrontend)) {
    allowedOrigins.push(cleanFrontend);
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, Postman, mobile requests (no origin header)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health / connectivity check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    success: true,
    message: 'AppsicaEcom Backend API is operational and ready.',
    port: Number(process.env.PORT) || 5000,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Health / test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AppsicaEcom Backend API is operational and ready.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.get('/api/auth/test-route', (req, res) => {
  res.json({
    success: true,
    message: 'Auth route is working'
  });
});
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/shipping', shippingRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
