// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  PRODUCTS: '/products',
  CATEGORY: '/category/:slug',
  SEARCH: '/search',
  PRODUCT_DETAILS: '/product/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  PAYMENT_PROCESSING: '/payment/processing',
  PAYMENT_RESULT: '/payment/result',
  ORDER_CONFIRMATION: '/order-confirmation/:id',
  MY_ORDERS: '/my-orders',
  TRACK_ORDER: '/track-order/:id',
  PROFILE: '/account/profile',
  ADDRESSES: '/account/addresses',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/account/notifications',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ADD_PRODUCT: '/admin/products/add',
  ADMIN_EDIT_PRODUCT: '/admin/products/edit/:id',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_SHIPPING: '/admin/shipping',
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
  UPI: 'upi',
  CARD: 'card',
};

// Sort Options
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'appsica_token',
  USER: 'appsica_user',
  CART: 'appsica_cart',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 12;

// Rating
export const MAX_RATING = 5;
