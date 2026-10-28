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

const notFound = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
