const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'postman');
const rootDir = path.join(__dirname, '..', '..', 'postman');

[backendDir, rootDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper to create test script that saves token
const createTokenSaveScript = (tokenVar) => [
  {
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: [
        'var jsonData = pm.response.json();',
        `if (jsonData && jsonData.token) {`,
        `    pm.environment.set("${tokenVar}", jsonData.token);`,
        `    console.log("Saved ${tokenVar}:", jsonData.token);`,
        '}',
      ],
    },
  },
];

// Helper to create request
const makeReq = ({ name, method, urlPath, query = [], body = null, tokenVar = null, desc = '', testScript = null }) => {
  const headers = [];
  if (body) {
    headers.push({ key: 'Content-Type', value: 'application/json' });
  }
  if (tokenVar) {
    headers.push({ key: 'Authorization', value: `Bearer {{${tokenVar}}}` });
  }

  const pathParts = urlPath.replace(/^\//, '').split('/');
  const rawUrl = `{{base_url}}/${pathParts.join('/')}` + (query.length ? '?' + query.map(q => `${q.key}=${q.value}`).join('&') : '');

  const reqItem = {
    name,
    request: {
      method,
      header: headers,
      url: {
        raw: rawUrl,
        host: ['{{base_url}}'],
        path: pathParts,
      },
      description: desc,
    },
    response: [],
  };

  if (query.length) {
    reqItem.request.url.query = query;
  }

  if (body) {
    reqItem.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  if (testScript) {
    reqItem.event = testScript;
  }

  return reqItem;
};

// =========================================================================
// COLLECTION DEFINITION
// =========================================================================
const collection = {
  info: {
    _postman_id: '8b7f3d2a-43e9-4e01-9f22-appsica2026',
    name: 'AppsicaEcom Multi-Vendor E-Commerce Platform API',
    description: 'Complete API documentation & testing suite for AppsicaEcom. Includes 4 distinct user roles: Customer, Multi-Vendor, Fleet Delivery Partner, and Super Admin.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    // 0. HEALTH CHECK
    {
      name: '0. Server Health Check',
      item: [
        makeReq({
          name: 'Health Check / Server Status',
          method: 'GET',
          urlPath: '/',
          desc: 'Verify if the backend server is running and database is accessible.',
        }),
      ],
    },

    // 1. AUTHENTICATION & PROFILE
    {
      name: '1. Authentication & Profile',
      item: [
        makeReq({
          name: 'Customer Registration',
          method: 'POST',
          urlPath: '/api/auth/register',
          body: {
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            password: 'password123',
            phone: '9876543210',
          },
          desc: 'Register a new customer account.',
        }),
        makeReq({
          name: 'Customer Login (Saves {{user_token}})',
          method: 'POST',
          urlPath: '/api/auth/login',
          body: {
            email: 'user@appsica.com',
            password: 'user123',
          },
          testScript: createTokenSaveScript('user_token'),
          desc: 'Log in as the demo customer and automatically store JWT into {{user_token}}.',
        }),
        makeReq({
          name: 'Get Current Profile',
          method: 'GET',
          urlPath: '/api/auth/profile',
          tokenVar: 'user_token',
          desc: 'Get profile information for the authenticated user.',
        }),
        makeReq({
          name: 'Update Current Profile',
          method: 'PUT',
          urlPath: '/api/auth/profile',
          tokenVar: 'user_token',
          body: {
            name: 'Alex Morgan Updated',
            phone: '9876543219',
          },
          desc: 'Update customer personal information.',
        }),
        makeReq({
          name: 'Forgot Password Request',
          method: 'POST',
          urlPath: '/api/auth/forgot-password',
          body: {
            email: 'user@appsica.com',
          },
          desc: 'Request password reset token.',
        }),
        makeReq({
          name: 'Reset Password',
          method: 'POST',
          urlPath: '/api/auth/reset-password',
          body: {
            token: 'RESET_TOKEN_HERE',
            newPassword: 'newpassword123',
          },
          desc: 'Set a new password using reset token.',
        }),
      ],
    },

    // 2. PRODUCTS & CATALOG
    {
      name: '2. Products & Catalog (Public)',
      item: [
        makeReq({
          name: 'Get All Products (Pagination & Filter)',
          method: 'GET',
          urlPath: '/api/products',
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '12' },
            { key: 'sort', value: 'newest' },
          ],
          desc: 'Fetch approved active products with optional pagination and sort filters.',
        }),
        makeReq({
          name: 'Get Featured Products',
          method: 'GET',
          urlPath: '/api/products/featured',
          desc: 'Fetch featured products for landing page showcase.',
        }),
        makeReq({
          name: 'Search Products',
          method: 'GET',
          urlPath: '/api/products/search',
          query: [
            { key: 'q', value: 'audio' },
          ],
          desc: 'Full-text search query across titles, tags, and descriptions.',
        }),
        makeReq({
          name: 'Get Products by Category Slug',
          method: 'GET',
          urlPath: '/api/products/category/electronics',
          desc: 'Filter products by specific category slug.',
        }),
        makeReq({
          name: 'Get Product Details by ID',
          method: 'GET',
          urlPath: '/api/products/{{product_id}}',
          desc: 'Fetch single product details with vendor info and stock balance.',
        }),
        makeReq({
          name: 'Get Product Reviews',
          method: 'GET',
          urlPath: '/api/products/{{product_id}}/reviews',
          desc: 'Get customer ratings and reviews for a product.',
        }),
        makeReq({
          name: 'Add Product Review',
          method: 'POST',
          urlPath: '/api/products/{{product_id}}/reviews',
          tokenVar: 'user_token',
          body: {
            rating: 5,
            title: 'Fantastic soundstage!',
            comment: 'Premium materials, quick delivery, and crisp high frequencies.',
          },
          desc: 'Submit a verified review for a purchased product.',
        }),
      ],
    },

    // 3. CATEGORIES
    {
      name: '3. Categories (Public)',
      item: [
        makeReq({
          name: 'Get All Categories',
          method: 'GET',
          urlPath: '/api/categories',
          desc: 'Retrieve active product categories.',
        }),
        makeReq({
          name: 'Get Category by Slug',
          method: 'GET',
          urlPath: '/api/categories/electronics',
          desc: 'Fetch category metadata and banner info.',
        }),
      ],
    },

    // 4. CART MANAGEMENT
    {
      name: '4. Cart Management',
      item: [
        makeReq({
          name: 'Get User Cart',
          method: 'GET',
          urlPath: '/api/cart',
          tokenVar: 'user_token',
          desc: 'Fetch user cart contents with real-time price calculations.',
        }),
        makeReq({
          name: 'Add Item to Cart',
          method: 'POST',
          urlPath: '/api/cart',
          tokenVar: 'user_token',
          body: {
            productId: '{{product_id}}',
            quantity: 1,
            selectedColor: 'Matte Black',
            selectedSize: 'Standard',
          },
          desc: 'Add product with optional variant specs into cart.',
        }),
        makeReq({
          name: 'Update Cart Item Quantity',
          method: 'PUT',
          urlPath: '/api/cart/{{cart_item_id}}',
          tokenVar: 'user_token',
          body: {
            quantity: 3,
          },
          desc: 'Update quantity of an existing item in the cart.',
        }),
        makeReq({
          name: 'Remove Item from Cart',
          method: 'DELETE',
          urlPath: '/api/cart/{{cart_item_id}}',
          tokenVar: 'user_token',
          desc: 'Delete a single item from user cart.',
        }),
        makeReq({
          name: 'Clear Cart',
          method: 'DELETE',
          urlPath: '/api/cart',
          tokenVar: 'user_token',
          desc: 'Empty all contents from user cart.',
        }),
      ],
    },

    // 5. WISHLIST
    {
      name: '5. Wishlist Management',
      item: [
        makeReq({
          name: 'Get User Wishlist',
          method: 'GET',
          urlPath: '/api/wishlist',
          tokenVar: 'user_token',
          desc: 'Get list of bookmarked products for customer.',
        }),
        makeReq({
          name: 'Add Product to Wishlist',
          method: 'POST',
          urlPath: '/api/wishlist',
          tokenVar: 'user_token',
          body: {
            productId: '{{product_id}}',
          },
          desc: 'Add product to favorites.',
        }),
        makeReq({
          name: 'Remove Product from Wishlist',
          method: 'DELETE',
          urlPath: '/api/wishlist/{{product_id}}',
          tokenVar: 'user_token',
          desc: 'Remove product from favorites.',
        }),
        makeReq({
          name: 'Check If Product is Wishlisted',
          method: 'GET',
          urlPath: '/api/wishlist/check/{{product_id}}',
          tokenVar: 'user_token',
          desc: 'Quick boolean lookup for UI bookmark heart icon.',
        }),
      ],
    },

    // 6. ADDRESS BOOK
    {
      name: '6. Address Book',
      item: [
        makeReq({
          name: 'Get Saved Addresses',
          method: 'GET',
          urlPath: '/api/addresses',
          tokenVar: 'user_token',
          desc: 'List all delivery addresses saved by customer.',
        }),
        makeReq({
          name: 'Add New Address',
          method: 'POST',
          urlPath: '/api/addresses',
          tokenVar: 'user_token',
          body: {
            fullName: 'Alex Morgan',
            phone: '9876543211',
            street: 'Flat 402, Green Valley Apartments',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411045',
            country: 'India',
            type: 'home',
            isDefault: true,
          },
          desc: 'Save new shipping address.',
        }),
        makeReq({
          name: 'Update Address',
          method: 'PUT',
          urlPath: '/api/addresses/{{address_id}}',
          tokenVar: 'user_token',
          body: {
            street: 'Flat 402, Green Valley Apartments, Baner Road',
            pincode: '411045',
          },
          desc: 'Modify existing address details.',
        }),
        makeReq({
          name: 'Set Address as Default',
          method: 'PUT',
          urlPath: '/api/addresses/{{address_id}}/default',
          tokenVar: 'user_token',
          desc: 'Make this address primary for fast 1-click checkout.',
        }),
        makeReq({
          name: 'Delete Address',
          method: 'DELETE',
          urlPath: '/api/addresses/{{address_id}}',
          tokenVar: 'user_token',
          desc: 'Remove address from book.',
        }),
      ],
    },

    // 7. CHECKOUT & COUPONS
    {
      name: '7. Checkout & Coupons',
      item: [
        makeReq({
          name: 'Get Checkout Summary / Calculations',
          method: 'POST',
          urlPath: '/api/checkout/summary',
          body: {
            items: [
              { productId: '{{product_id}}', quantity: 2 },
            ],
            couponCode: 'WELCOME10',
            shippingMethod: 'express',
          },
          desc: 'Calculate subtotal, shipping fee, taxes, and coupon discounts.',
        }),
        makeReq({
          name: 'Apply Coupon',
          method: 'POST',
          urlPath: '/api/checkout/coupon',
          body: {
            code: 'APPSICA20',
            cartTotal: 4000,
          },
          desc: 'Validate discount voucher conditions and compute discount amount.',
        }),
        makeReq({
          name: 'Remove Coupon',
          method: 'DELETE',
          urlPath: '/api/checkout/coupon',
          desc: 'Remove coupon from active checkout session.',
        }),
        makeReq({
          name: 'Get Delivery Shipping Options',
          method: 'GET',
          urlPath: '/api/checkout/delivery',
          desc: 'Retrieve standard vs express delivery SLA & costs.',
        }),
        makeReq({
          name: 'Place Order',
          method: 'POST',
          urlPath: '/api/checkout/place-order',
          tokenVar: 'user_token',
          body: {
            shippingAddress: {
              fullName: 'Alex Morgan',
              phone: '9876543211',
              street: 'Flat 402, Green Valley Apartments',
              city: 'Pune',
              state: 'Maharashtra',
              pincode: '411045',
            },
            paymentMethod: 'card',
            couponCode: 'WELCOME10',
          },
          desc: 'Complete order placement from cart items.',
        }),
      ],
    },

    // 8. ORDERS & TRACKING
    {
      name: '8. Customer Orders & Tracking',
      item: [
        makeReq({
          name: 'Get My Orders',
          method: 'GET',
          urlPath: '/api/orders',
          tokenVar: 'user_token',
          desc: 'List historical orders for authenticated customer.',
        }),
        makeReq({
          name: 'Get Order by ID',
          method: 'GET',
          urlPath: '/api/orders/{{order_id}}',
          tokenVar: 'user_token',
          desc: 'Get order details, items, invoice breakdown, and current delivery status.',
        }),
        makeReq({
          name: 'Track Order Timeline',
          method: 'GET',
          urlPath: '/api/orders/{{order_id}}/track',
          tokenVar: 'user_token',
          desc: 'Real-time tracking timeline: Ordered -> Confirmed -> Dispatched -> Out for Delivery -> Delivered.',
        }),
        makeReq({
          name: 'Cancel Order',
          method: 'PUT',
          urlPath: '/api/orders/{{order_id}}/cancel',
          tokenVar: 'user_token',
          body: {
            reason: 'Ordered by mistake',
          },
          desc: 'Cancel pending/confirmed order and restock inventory.',
        }),
        makeReq({
          name: 'Request Return / Refund',
          method: 'POST',
          urlPath: '/api/orders/{{order_id}}/return',
          tokenVar: 'user_token',
          body: {
            itemId: '{{order_item_id}}',
            reason: 'Received wrong color variant',
            comment: 'Requested replacement with Black edition.',
          },
          desc: 'Initiate return/replacement workflow for delivered item.',
        }),
      ],
    },

    // 9. PAYMENTS
    {
      name: '9. Payments Gateway Simulation',
      item: [
        makeReq({
          name: 'Initiate Payment Intent',
          method: 'POST',
          urlPath: '/api/payments/initiate',
          body: {
            orderId: '{{order_id}}',
            amount: 4500,
            currency: 'INR',
            method: 'card',
          },
          desc: 'Generate secure transaction ref and gateway session.',
        }),
        makeReq({
          name: 'Verify Payment Callback',
          method: 'POST',
          urlPath: '/api/payments/verify',
          body: {
            paymentId: 'PAY-SAMPLE-1234',
            orderId: '{{order_id}}',
            signature: 'sig_mock_verified',
            status: 'success',
          },
          desc: 'Verify gateway webhook or frontend signature.',
        }),
        makeReq({
          name: 'Get Payment Status',
          method: 'GET',
          urlPath: '/api/payments/PAY-SAMPLE-1234',
          desc: 'Query transaction receipt and settlement state.',
        }),
      ],
    },

    // 10. VENDOR CENTRAL
    {
      name: '10. Vendor Central (Multi-Seller)',
      item: [
        makeReq({
          name: 'Vendor Self-Registration',
          method: 'POST',
          urlPath: '/api/vendor/register',
          body: {
            name: 'Sunil Rao',
            email: 'sunil.electronics@appsica.com',
            password: 'vendorPassword123',
            phone: '9876599111',
            storeName: 'Rao Smart Devices',
            storeDescription: 'Certified distributor of wireless chargers and audio.',
            businessAddress: 'Sector 18, Electronic City, Bengaluru, KA',
            taxId: '29AABCR1234F1Z9',
          },
          desc: 'Register as a seller (status: pending admin verification).',
        }),
        makeReq({
          name: 'Vendor Login (Saves {{vendor_token}})',
          method: 'POST',
          urlPath: '/api/vendor/login',
          body: {
            email: 'vendor@appsica.com',
            password: 'vendor123',
          },
          testScript: createTokenSaveScript('vendor_token'),
          desc: 'Login as approved vendor (Marcus Vance - Aura Sound).',
        }),
        makeReq({
          name: 'Vendor Profile',
          method: 'GET',
          urlPath: '/api/vendor/profile',
          tokenVar: 'vendor_token',
          desc: 'Fetch vendor store details, commission rate, and payout banking info.',
        }),
        makeReq({
          name: 'Update Vendor Profile & Bank Details',
          method: 'PUT',
          urlPath: '/api/vendor/profile',
          tokenVar: 'vendor_token',
          body: {
            storeName: 'Aura Sound & Acoustic Tech',
            storeDescription: 'Crafting audiophile acoustic gear and ambient desktop accessories.',
            payoutDetails: {
              accountHolder: 'Marcus Vance',
              accountNumber: '98765432109876',
              bankName: 'HDFC Bank Ltd',
              ifsc: 'HDFC0001234',
              upiId: 'aurasound@upi',
            },
          },
          desc: 'Update vendor store branding and payout bank details.',
        }),
        makeReq({
          name: 'Vendor Dashboard Analytics',
          method: 'GET',
          urlPath: '/api/vendor/dashboard',
          tokenVar: 'vendor_token',
          desc: 'Real-time sales, total orders, pending shipments, and net earnings.',
        }),
        makeReq({
          name: 'Vendor Products List',
          method: 'GET',
          urlPath: '/api/vendor/products',
          tokenVar: 'vendor_token',
          desc: 'List catalog products uploaded by this vendor.',
        }),
        makeReq({
          name: 'Create Vendor Product',
          method: 'POST',
          urlPath: '/api/vendor/products',
          tokenVar: 'vendor_token',
          body: {
            name: 'Acoustic Studio Monoblock AMP',
            description: 'Class-A discrete headphone amplifier with balanced 4.4mm output.',
            price: 18999,
            comparePrice: 22999,
            stock: 20,
            category: '{{category_id}}',
            images: [
              'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
            ],
            tags: ['amplifier', 'audiophile', 'desktop'],
          },
          desc: 'Publish a new product to marketplace catalog.',
        }),
        makeReq({
          name: 'Update Vendor Product',
          method: 'PUT',
          urlPath: '/api/vendor/products/{{vendor_product_id}}',
          tokenVar: 'vendor_token',
          body: {
            price: 17999,
            stock: 25,
          },
          desc: 'Edit pricing or inventory for vendor product.',
        }),
        makeReq({
          name: 'Delete Vendor Product',
          method: 'DELETE',
          urlPath: '/api/vendor/products/{{vendor_product_id}}',
          tokenVar: 'vendor_token',
          desc: 'Remove product from marketplace.',
        }),
        makeReq({
          name: 'Vendor Orders List',
          method: 'GET',
          urlPath: '/api/vendor/orders',
          tokenVar: 'vendor_token',
          desc: 'Get orders containing products sold by this vendor.',
        }),
        makeReq({
          name: 'Update Vendor Order Fulfillment Status',
          method: 'PUT',
          urlPath: '/api/vendor/orders/{{order_id}}/status',
          tokenVar: 'vendor_token',
          body: {
            status: 'Processing',
          },
          desc: 'Move item from Pending to Processing/Packed.',
        }),
        makeReq({
          name: 'Vendor Financial Ledger & Reports',
          method: 'GET',
          urlPath: '/api/vendor/reports',
          tokenVar: 'vendor_token',
          desc: 'Commission deducted, net payout balance, and settlement history.',
        }),
        makeReq({
          name: 'Vendor Customer Reviews',
          method: 'GET',
          urlPath: '/api/vendor/reviews',
          tokenVar: 'vendor_token',
          desc: 'List feedback and ratings left on vendor products.',
        }),
        makeReq({
          name: 'Reply to Customer Review',
          method: 'POST',
          urlPath: '/api/vendor/reviews/{{review_id}}/reply',
          tokenVar: 'vendor_token',
          body: {
            text: 'Thank you for your feedback! We are thrilled that you loved the acoustic quality.',
          },
          desc: 'Official vendor public reply to review.',
        }),
      ],
    },

    // 11. DELIVERY FLEET PARTNER
    {
      name: '11. Delivery Fleet Partner Portal',
      item: [
        makeReq({
          name: 'Rider Self-Registration',
          method: 'POST',
          urlPath: '/api/delivery/register',
          body: {
            name: 'Karan Mehra',
            email: 'karan.rider@appsica.com',
            password: 'riderPassword123',
            phone: '9876588222',
            vehicleType: 'bike',
            vehicleNumber: 'MH-12-AB-9988',
            licenseNumber: 'DL-MH-2026-0001',
          },
          desc: 'Register new delivery partner (status: pending admin verification).',
        }),
        makeReq({
          name: 'Rider Login (Saves {{delivery_token}})',
          method: 'POST',
          urlPath: '/api/delivery/login',
          body: {
            email: 'delivery@appsica.com',
            password: 'delivery123',
          },
          testScript: createTokenSaveScript('delivery_token'),
          desc: 'Login as approved fleet delivery partner (Vikram Sharma).',
        }),
        makeReq({
          name: 'Rider Profile',
          method: 'GET',
          urlPath: '/api/delivery/profile',
          tokenVar: 'delivery_token',
          desc: 'Get rider details, duty status, vehicle specs, and verified documents.',
        }),
        makeReq({
          name: 'Toggle Duty Availability (Online/Offline)',
          method: 'PUT',
          urlPath: '/api/delivery/toggle-availability',
          tokenVar: 'delivery_token',
          desc: 'Switch active rider status between Online and Offline.',
        }),
        makeReq({
          name: 'Update Live GPS Location',
          method: 'PUT',
          urlPath: '/api/delivery/location',
          tokenVar: 'delivery_token',
          body: {
            latitude: 18.559,
            longitude: 73.7868,
          },
          desc: 'Push rider GPS coordinates for proximity dispatching.',
        }),
        makeReq({
          name: 'Rider Dashboard & Metrics',
          method: 'GET',
          urlPath: '/api/delivery/dashboard',
          tokenVar: 'delivery_token',
          desc: 'Total trips, today earnings, pending pickups, and active delivery stats.',
        }),
        makeReq({
          name: 'Get Assigned Orders',
          method: 'GET',
          urlPath: '/api/delivery/assigned-orders',
          tokenVar: 'delivery_token',
          desc: 'View active orders allocated to this rider for pickup/delivery.',
        }),
        makeReq({
          name: 'Accept Order Assignment',
          method: 'PUT',
          urlPath: '/api/delivery/order/{{order_id}}/accept',
          tokenVar: 'delivery_token',
          desc: 'Accept assigned order trip.',
        }),
        makeReq({
          name: 'Arrive at Merchant / Pickup Hub',
          method: 'PUT',
          urlPath: '/api/delivery/order/{{order_id}}/arrive-pickup',
          tokenVar: 'delivery_token',
          desc: 'Notify vendor that rider has arrived at warehouse/store.',
        }),
        makeReq({
          name: 'Confirm Pickup from Seller',
          method: 'PUT',
          urlPath: '/api/delivery/order/{{order_id}}/confirm-pickup',
          tokenVar: 'delivery_token',
          desc: 'Confirm parcel collection from merchant.',
        }),
        makeReq({
          name: 'Start Out for Delivery (Generates OTP)',
          method: 'PUT',
          urlPath: '/api/delivery/order/{{order_id}}/out-for-delivery',
          tokenVar: 'delivery_token',
          desc: 'Mark order as Out for Delivery and trigger SMS/Email OTP to customer.',
        }),
        makeReq({
          name: 'Verify OTP & Complete Delivery',
          method: 'PUT',
          urlPath: '/api/delivery/order/{{order_id}}/verify-otp',
          tokenVar: 'delivery_token',
          body: {
            otp: '1234',
          },
          desc: 'Validate 4-digit customer delivery OTP to mark order Delivered and credit delivery fee.',
        }),
        makeReq({
          name: 'Delivery Trip History',
          method: 'GET',
          urlPath: '/api/delivery/history',
          tokenVar: 'delivery_token',
          desc: 'Completed and closed trips history.',
        }),
        makeReq({
          name: 'Rider Earnings & Payout Ledger',
          method: 'GET',
          urlPath: '/api/delivery/earnings',
          tokenVar: 'delivery_token',
          desc: 'Per-order delivery fee earnings and settlement balance.',
        }),
      ],
    },

    // 12. SUPER ADMIN PORTAL
    {
      name: '12. Super Admin Portal (Full RBAC)',
      item: [
        makeReq({
          name: 'Admin Login (Saves {{admin_token}})',
          method: 'POST',
          urlPath: '/api/auth/login',
          body: {
            email: 'admin@appsica.com',
            password: 'admin123',
          },
          testScript: createTokenSaveScript('admin_token'),
          desc: 'Authenticate as Super Admin and save {{admin_token}}.',
        }),
        makeReq({
          name: 'Admin Global Dashboard Stats',
          method: 'GET',
          urlPath: '/api/admin/dashboard',
          tokenVar: 'admin_token',
          desc: 'Aggregated revenue, orders, active vendors, delivery partners, and sales trends.',
        }),
        makeReq({
          name: 'Admin - List All Products (Inc. Pending)',
          method: 'GET',
          urlPath: '/api/admin/products',
          tokenVar: 'admin_token',
          desc: 'Inspect all marketplace products across all vendors.',
        }),
        makeReq({
          name: 'Admin - Moderate Product (Approve / Reject)',
          method: 'PUT',
          urlPath: '/api/admin/products/{{product_id}}/approval',
          tokenVar: 'admin_token',
          body: {
            status: 'approved',
            adminNotes: 'Meets marketplace catalog quality standards.',
          },
          desc: 'Approve or reject seller product submissions.',
        }),
        makeReq({
          name: 'Admin - Create Product Directly',
          method: 'POST',
          urlPath: '/api/admin/products',
          tokenVar: 'admin_token',
          body: {
            name: 'Appsica Signature Noise Isolating Headphones',
            description: 'Ultra-low latency Bluetooth 5.4 flagship audio gear.',
            price: 12999,
            comparePrice: 15999,
            stock: 50,
            category: '{{category_id}}',
            images: [
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            ],
            tags: ['flagship', 'audio'],
          },
          desc: 'Platform in-house product creation.',
        }),
        makeReq({
          name: 'Admin - Create Category',
          method: 'POST',
          urlPath: '/api/admin/categories',
          tokenVar: 'admin_token',
          body: {
            name: 'Smart Home & IoT',
            slug: 'smart-home',
            mark: '05',
            tone: 'emerald',
            description: 'Connected living, smart lighting, automated hubs, and acoustic sensors.',
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
          },
          desc: 'Create new product category with UI badge and theme tone.',
        }),
        makeReq({
          name: 'Admin - List All Orders',
          method: 'GET',
          urlPath: '/api/admin/orders',
          tokenVar: 'admin_token',
          desc: 'Filterable list of all orders across platform.',
        }),
        makeReq({
          name: 'Admin - Assign Delivery Partner to Order',
          method: 'PUT',
          urlPath: '/api/admin/orders/{{order_id}}/assign-delivery',
          tokenVar: 'admin_token',
          body: {
            deliveryPartnerId: '{{delivery_partner_id}}',
          },
          desc: 'Assign vetted fleet rider to fulfill order.',
        }),
        makeReq({
          name: 'Admin - List All Customers',
          method: 'GET',
          urlPath: '/api/admin/customers',
          tokenVar: 'admin_token',
          desc: 'Customer registry with order count and account status.',
        }),
        makeReq({
          name: 'Admin - List All Vendors',
          method: 'GET',
          urlPath: '/api/admin/vendors',
          tokenVar: 'admin_token',
          desc: 'Review approved, pending, and suspended sellers.',
        }),
        makeReq({
          name: 'Admin - Approve / Reject Vendor Store',
          method: 'PUT',
          urlPath: '/api/admin/vendors/{{vendor_id}}/status',
          tokenVar: 'admin_token',
          body: {
            status: 'approved',
            commissionRate: 10,
          },
          desc: 'Approve vendor application and assign customized commission rate.',
        }),
        makeReq({
          name: 'Admin - List Delivery Partners',
          method: 'GET',
          urlPath: '/api/admin/delivery-partners',
          tokenVar: 'admin_token',
          desc: 'List fleet riders and their verification statuses.',
        }),
        makeReq({
          name: 'Admin - Approve / Reject Delivery Partner',
          method: 'PUT',
          urlPath: '/api/admin/delivery-partners/{{delivery_partner_id}}/status',
          tokenVar: 'admin_token',
          body: {
            status: 'approved',
          },
          desc: 'Approve delivery rider license and vehicle credentials.',
        }),
        makeReq({
          name: 'Admin - List Vendor Payout Requests',
          method: 'GET',
          urlPath: '/api/admin/payouts',
          tokenVar: 'admin_token',
          desc: 'Vendor commission balance settlements ledger.',
        }),
        makeReq({
          name: 'Admin - Create Vendor Payout Settlement',
          method: 'POST',
          urlPath: '/api/admin/payouts',
          tokenVar: 'admin_token',
          body: {
            vendorId: '{{vendor_id}}',
            amount: 25000,
            paymentMethod: 'bank_transfer',
            transactionRef: 'NEFT-2026-992211',
            notes: 'October Bi-weekly settlement',
          },
          desc: 'Record disbursed vendor payout.',
        }),
        makeReq({
          name: 'Admin - List Return & Refund Requests',
          method: 'GET',
          urlPath: '/api/admin/returns',
          tokenVar: 'admin_token',
          desc: 'Review customer return claims and disputes.',
        }),
        makeReq({
          name: 'Admin - Update Return Request Decision',
          method: 'PUT',
          urlPath: '/api/admin/returns/{{return_id}}/status',
          tokenVar: 'admin_token',
          body: {
            status: 'approved',
            adminNotes: 'Product returned in original packaging. Refund approved.',
          },
          desc: 'Approve/reject return and trigger refund workflow.',
        }),
        makeReq({
          name: 'Admin - List Marketing Coupons',
          method: 'GET',
          urlPath: '/api/admin/coupons',
          tokenVar: 'admin_token',
          desc: 'All active and expired promo codes.',
        }),
        makeReq({
          name: 'Admin - Create Promotional Coupon',
          method: 'POST',
          urlPath: '/api/admin/coupons',
          tokenVar: 'admin_token',
          body: {
            code: 'FESTIVE30',
            discountType: 'percentage',
            discountValue: 30,
            maxDiscountAmount: 2000,
            minOrderAmount: 3000,
            expiryDate: '2026-12-31T23:59:59.000Z',
            usageLimit: 500,
            description: 'Flat 30% off on all festive orders above ₹3000',
          },
          desc: 'Create discount voucher code.',
        }),
        makeReq({
          name: 'Admin - List System Audit Logs',
          method: 'GET',
          urlPath: '/api/admin/audit-logs',
          tokenVar: 'admin_token',
          desc: 'Immutable security audit trail of all administrative actions.',
        }),
        makeReq({
          name: 'Admin - Get Global System Settings',
          method: 'GET',
          urlPath: '/api/admin/settings',
          tokenVar: 'admin_token',
          desc: 'Platform defaults (Default commission %, tax rates, support contact).',
        }),
        makeReq({
          name: 'Admin - Update Global System Settings',
          method: 'PUT',
          urlPath: '/api/admin/settings',
          tokenVar: 'admin_token',
          body: {
            defaultCommissionRate: 10,
            taxRate: 18,
            supportEmail: 'support@appsica.com',
            supportPhone: '1800-APPSICA-HELP',
          },
          desc: 'Update platform-wide business configuration.',
        }),
        makeReq({
          name: 'Admin - Get Exportable Reports Data',
          method: 'GET',
          urlPath: '/api/admin/reports',
          tokenVar: 'admin_token',
          desc: 'Aggregated analytics payload for CSV / PDF export.',
        }),
      ],
    },
  ],
};

// =========================================================================
// ENVIRONMENT DEFINITION
// =========================================================================
const environment = {
  id: 'appsica-env-2026',
  name: 'AppsicaEcom Local / Render Environment',
  values: [
    {
      key: 'base_url',
      value: 'http://localhost:5000',
      type: 'default',
      enabled: true,
    },
    {
      key: 'user_token',
      value: '',
      type: 'secret',
      enabled: true,
    },
    {
      key: 'admin_token',
      value: '',
      type: 'secret',
      enabled: true,
    },
    {
      key: 'vendor_token',
      value: '',
      type: 'secret',
      enabled: true,
    },
    {
      key: 'delivery_token',
      value: '',
      type: 'secret',
      enabled: true,
    },
    {
      key: 'product_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'category_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'order_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'cart_item_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'address_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'vendor_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'delivery_partner_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'review_id',
      value: '',
      type: 'default',
      enabled: true,
    },
    {
      key: 'return_id',
      value: '',
      type: 'default',
      enabled: true,
    },
  ],
  _postman_variable_scope: 'environment',
};

// Write files to both directories
[backendDir, rootDir].forEach((dir) => {
  const collectionPath = path.join(dir, 'AppsicaEcom.postman_collection.json');
  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');

  const envPath = path.join(dir, 'AppsicaEcom.postman_environment.json');
  fs.writeFileSync(envPath, JSON.stringify(environment, null, 2), 'utf8');

  console.log('Saved files to:', dir);
});

console.log('Total top-level folders:', collection.item.length);
let totalReqs = 0;
collection.item.forEach((f) => {
  totalReqs += f.item.length;
});
console.log('Total API requests:', totalReqs);

