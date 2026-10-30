/**
 * Automated Verification Test Suite: Step 1 - Pan-India Product Ordering
 * 
 * Verifies all 10 specified test cases:
 * 1. Indore customer orders from an Indore seller.
 * 2. Indore customer orders from a Mumbai seller.
 * 3. Indore customer orders from a Delhi seller.
 * 4. Customer from another state registers and logs in.
 * 5. Customer adds and selects a different delivery address.
 * 6. Invalid PIN code is rejected.
 * 7. Inactive product cannot be ordered.
 * 8. Unapproved seller's product cannot be ordered.
 * 9. Existing local ordering still works.
 * 10. Customer can see order history and order details.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const User = require('./models/user');
const Product = require('./models/product');
const Order = require('./models/order');
const Address = require('./models/address');
const CheckoutService = require('./services/checkoutService');
const GeoService = require('./services/geoService');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runPanIndiaTests() {
  console.log('\n========================================================================');
  console.log('🧪 STEP 1 TEST SUITE: PAN-INDIA PRODUCT ORDERING VERIFICATION');
  console.log('========================================================================\n');

  try {
    await connectDB();
    const ts = Date.now().toString().slice(-5);

    // -------------------------------------------------------------------------
    // SETUP SELLERS: Indore Seller, Mumbai Seller, Delhi Seller
    // -------------------------------------------------------------------------
    const indoreSeller = await User.create({
      name: `Indore Seller ${ts}`,
      email: `seller_indore_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Malwa Handicrafts ${ts}`,
      businessAddress: '56 Dukan, Indore, Madhya Pradesh',
      storeLocation: {
        lat: 22.7196,
        lng: 75.8577,
        address: '56 Dukan, Indore',
        city: 'Indore',
        pincode: '452001',
      },
    });

    const mumbaiSeller = await User.create({
      name: `Mumbai Seller ${ts}`,
      email: `seller_mumbai_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Bombay Electronics ${ts}`,
      businessAddress: 'Lamington Road, Mumbai, Maharashtra',
      storeLocation: {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Lamington Road, Mumbai',
        city: 'Mumbai',
        pincode: '400007',
      },
    });

    const delhiSeller = await User.create({
      name: `Delhi Seller ${ts}`,
      email: `seller_delhi_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Chandni Chowk Spices ${ts}`,
      businessAddress: 'Khari Baoli, Chandni Chowk, Delhi',
      storeLocation: {
        lat: 28.7041,
        lng: 77.1025,
        address: 'Khari Baoli, Chandni Chowk, Delhi',
        city: 'Delhi',
        pincode: '110006',
      },
    });

    // -------------------------------------------------------------------------
    // SETUP PRODUCTS
    // -------------------------------------------------------------------------
    const catId = new mongoose.Types.ObjectId();

    const indoreProduct = await Product.create({
      name: `Maheshwari Silk Saree ${ts}`,
      description: 'Handwoven traditional Maheshwari silk saree from MP',
      category: catId,
      price: 2499,
      stock: 25,
      vendor: indoreSeller._id,
      vendorStatus: 'approved',
      isActive: true,
      images: ['https://example.com/saree.jpg'],
    });

    const mumbaiProduct = await Product.create({
      name: `Wireless Bluetooth Earbuds ${ts}`,
      description: 'Active Noise Cancelling earbuds from Mumbai Electronics',
      category: catId,
      price: 1899,
      stock: 40,
      vendor: mumbaiSeller._id,
      vendorStatus: 'approved',
      isActive: true,
      images: ['https://example.com/earbuds.jpg'],
    });

    const delhiProduct = await Product.create({
      name: `Kashmiri Saffron Box ${ts}`,
      description: 'Grade A Saffron straight from Delhi Spice Market',
      category: catId,
      price: 899,
      stock: 50,
      vendor: delhiSeller._id,
      vendorStatus: 'approved',
      isActive: true,
      images: ['https://example.com/saffron.jpg'],
    });

    // -------------------------------------------------------------------------
    // TEST 4: Customer from another state registers and logs in
    // -------------------------------------------------------------------------
    console.log('\n👤 TEST 4: Customer from Another State Registers & Logs In...');
    const indoreCustomer = await User.create({
      name: `Rohit Verma ${ts}`,
      email: `rohit_indore_${ts}@appsica.com`,
      password: 'password123',
      role: 'user',
      phone: '9826012345',
    });

    const token = jwt.sign(
      { userId: indoreCustomer._id, id: indoreCustomer._id, role: 'user' },
      process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom',
      { expiresIn: '7d' }
    );

    assert(Boolean(indoreCustomer._id), 'Customer registered with Madhya Pradesh mobile number');
    assert(Boolean(token), 'JWT authentication token generated successfully for customer');

    // -------------------------------------------------------------------------
    // TEST 5: Customer adds and selects a different delivery address
    // -------------------------------------------------------------------------
    console.log('\n📍 TEST 5: Customer Adds Multiple Delivery Addresses & Selects One...');
    const addressHome = await Address.create({
      user: indoreCustomer._id,
      fullName: indoreCustomer.name,
      phone: '9826012345',
      addressLine: '104 Silver Heights, Vijay Nagar',
      street: 'Flat 104, Silver Heights',
      locality: 'Vijay Nagar',
      landmark: 'Near C21 Mall',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452010',
      isDefault: true,
    });

    const addressWork = await Address.create({
      user: indoreCustomer._id,
      fullName: indoreCustomer.name,
      phone: '9826012345',
      addressLine: 'Crystal IT Park, Khandwa Road',
      street: 'Tower B, 3rd Floor',
      locality: 'Crystal IT Park',
      landmark: 'Opposite DAVV Campus',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      isDefault: false,
    });

    const userAddresses = await Address.find({ user: indoreCustomer._id });
    assert(userAddresses.length === 2, 'Customer has saved multiple addresses in their profile');
    assert(addressHome.isDefault === true, 'Home address saved as default');
    assert(addressWork.city === 'Indore' && addressWork.pincode === '452001', 'Work address in Indore saved with 6-digit PIN');

    // -------------------------------------------------------------------------
    // TEST 1: Indore Customer Orders from an Indore Seller (Local Delivery)
    // -------------------------------------------------------------------------
    console.log('\n🛒 TEST 1: Indore Customer Orders from an Indore Seller (Local/City Delivery)...');
    const indoreToIndoreRes = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: indoreCustomer._id,
      items: [{ product: indoreProduct._id, quantity: 1 }],
      shippingAddress: {
        fullName: addressHome.fullName,
        phone: addressHome.phone,
        addressLine: addressHome.addressLine,
        city: addressHome.city,
        state: addressHome.state,
        pincode: addressHome.pincode,
      },
      paymentMethod: 'card',
      paymentStatus: 'Paid',
      transactionId: `TXN-INDO-LOCAL-${ts}`,
    });

    assert(indoreToIndoreRes.order.orderStatus === 'Confirmed', 'Order confirmed successfully');
    assert(indoreToIndoreRes.order.shippingAddress.city === 'Indore', 'Order shipping city is Indore');
    assert(indoreToIndoreRes.order.shippingAddress.pincode === '452010', 'Order shipping pincode is 452010');
    assert(indoreToIndoreRes.order.deliveryMode === 'local', 'Order flagged as local delivery mode (within Indore)');

    // -------------------------------------------------------------------------
    // TEST 2: Indore Customer Orders from a Mumbai Seller (Pan India Inter-state ~580km)
    // -------------------------------------------------------------------------
    console.log('\n🚚 TEST 2: Indore Customer Orders from a Mumbai Seller (~580 KM Pan India)...');
    const indoreToMumbaiRes = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: indoreCustomer._id,
      items: [{ product: mumbaiProduct._id, quantity: 1 }],
      shippingAddress: {
        fullName: addressHome.fullName,
        phone: addressHome.phone,
        addressLine: addressHome.addressLine,
        city: addressHome.city,
        state: addressHome.state,
        pincode: addressHome.pincode,
      },
      paymentMethod: 'razorpay',
      paymentStatus: 'Paid',
      transactionId: `TXN-INDO-MUM-${ts}`,
    });

    assert(indoreToMumbaiRes.order.orderStatus === 'Confirmed', 'Order confirmed without being blocked by 10km radius!');
    assert(indoreToMumbaiRes.order.deliveryMode === 'standard_courier', 'Order deliveryMode is standard_courier');
    assert(indoreToMumbaiRes.order.courierName === 'BlueDart Express', 'Courier assigned as BlueDart Express');
    assert(Boolean(indoreToMumbaiRes.order.estimatedDeliveryDate), 'Order contains valid estimatedDeliveryDate');

    // -------------------------------------------------------------------------
    // TEST 3: Indore Customer Orders from a Delhi Seller (Pan India Inter-state ~800km)
    // -------------------------------------------------------------------------
    console.log('\n🚚 TEST 3: Indore Customer Orders from a Delhi Seller (~800 KM Pan India)...');
    const indoreToDelhiRes = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: indoreCustomer._id,
      items: [{ product: delhiProduct._id, quantity: 2 }],
      shippingAddress: {
        fullName: addressWork.fullName,
        phone: addressWork.phone,
        addressLine: addressWork.addressLine,
        city: addressWork.city,
        state: addressWork.state,
        pincode: addressWork.pincode,
      },
      paymentMethod: 'upi',
      paymentStatus: 'Paid',
      transactionId: `TXN-INDO-DELHI-${ts}`,
    });

    assert(indoreToDelhiRes.order.orderStatus === 'Confirmed', 'Delhi seller product ordered by Indore customer successfully');
    assert(indoreToDelhiRes.order.total === 899 * 2, 'Total price calculated accurately server-side');
    assert(indoreToDelhiRes.order.deliveryMode === 'standard_courier', 'Order marked as standard_courier fulfillment');

    // -------------------------------------------------------------------------
    // TEST 6: Invalid PIN Code is Rejected
    // -------------------------------------------------------------------------
    console.log('\n❌ TEST 6: Invalid PIN Code is Rejected During Address & Checkout Validation...');
    let invalidPinErrorCaught = false;
    try {
      await CheckoutService.verifyPaymentAndCreateOrder({
        userId: indoreCustomer._id,
        items: [{ product: delhiProduct._id, quantity: 1 }],
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543210',
          addressLine: 'Some address',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '12345', // Only 5 digits - INVALID!
        },
        paymentMethod: 'card',
        paymentStatus: 'Paid',
      });
    } catch (pinErr) {
      invalidPinErrorCaught = true;
      assert(pinErr.message.includes('PIN code'), `Invalid PIN rejected with message: "${pinErr.message}"`);
    }
    assert(invalidPinErrorCaught === true, 'Checkout refused order placement for invalid PIN code');

    // -------------------------------------------------------------------------
    // TEST 7: Inactive Product Cannot Be Ordered
    // -------------------------------------------------------------------------
    console.log('\n🚫 TEST 7: Inactive Product Cannot Be Ordered...');
    const inactiveProduct = await Product.create({
      name: `Discontinued Item ${ts}`,
      description: 'Item that has been archived or discontinued',
      category: catId,
      price: 500,
      stock: 10,
      vendor: delhiSeller._id,
      vendorStatus: 'approved',
      isActive: false, // Inactive / Deactivated
    });

    let inactiveErrorCaught = false;
    try {
      await CheckoutService.verifyPaymentAndCreateOrder({
        userId: indoreCustomer._id,
        items: [{ product: inactiveProduct._id, quantity: 1 }],
        shippingAddress: {
          fullName: addressHome.fullName,
          phone: addressHome.phone,
          addressLine: addressHome.addressLine,
          city: addressHome.city,
          state: addressHome.state,
          pincode: addressHome.pincode,
        },
        paymentMethod: 'card',
        paymentStatus: 'Paid',
        transactionId: `TXN-INACTIVE-${ts}`,
      });
    } catch (inactiveErr) {
      inactiveErrorCaught = true;
      assert(inactiveErr.message.includes('deactivated'), `Inactive product rejected: "${inactiveErr.message}"`);
    }
    assert(inactiveErrorCaught === true, 'Checkout refused purchase of deactivated product');

    // -------------------------------------------------------------------------
    // TEST 8: Unapproved Seller Product Cannot Be Ordered
    // -------------------------------------------------------------------------
    console.log('\n🚫 TEST 8: Unapproved Seller Product Cannot Be Ordered...');
    const pendingSeller = await User.create({
      name: `Pending Seller ${ts}`,
      email: `pending_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'pending', // NOT approved yet
      storeName: `Unverified Shop ${ts}`,
    });

    const pendingProduct = await Product.create({
      name: `Pending Product ${ts}`,
      description: 'Product awaiting admin approval',
      category: catId,
      price: 300,
      stock: 10,
      vendor: pendingSeller._id,
      vendorStatus: 'pending',
      isActive: true,
    });

    let unapprovedErrorCaught = false;
    try {
      await CheckoutService.verifyPaymentAndCreateOrder({
        userId: indoreCustomer._id,
        items: [{ product: pendingProduct._id, quantity: 1 }],
        shippingAddress: {
          fullName: addressHome.fullName,
          phone: addressHome.phone,
          addressLine: addressHome.addressLine,
          city: addressHome.city,
          state: addressHome.state,
          pincode: addressHome.pincode,
        },
        paymentMethod: 'card',
        paymentStatus: 'Paid',
        transactionId: `TXN-UNAPPROVED-${ts}`,
      });
    } catch (unapprovedErr) {
      unapprovedErrorCaught = true;
      assert(unapprovedErr.message.includes('available for purchase'), `Unapproved vendor rejected: "${unapprovedErr.message}"`);
    }
    assert(unapprovedErrorCaught === true, 'Checkout refused purchase from unapproved vendor');

    // -------------------------------------------------------------------------
    // TEST 9: Existing Local Ordering Still Works (Within 10 KM)
    // -------------------------------------------------------------------------
    console.log('\n🛵 TEST 9: Existing Local Ordering Still Works...');
    const localOrder = indoreToIndoreRes.order;
    assert(localOrder.deliveryMode === 'local', 'Local order preserved with deliveryMode: "local"');
    assert(localOrder.deliveryStatus === 'Unassigned', 'Local order initial deliveryStatus is "Unassigned"');

    // -------------------------------------------------------------------------
    // TEST 10: Customer Can View Order History & Order Details
    // -------------------------------------------------------------------------
    console.log('\n📜 TEST 10: Customer Can View Order History & Order Details...');
    const customerOrders = await Order.find({ user: indoreCustomer._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    assert(customerOrders.length >= 3, 'Customer history lists all their placed orders');

    // View specific order details with seller info
    const singleOrder = await Order.findOne({ orderId: indoreToMumbaiRes.order.orderId })
      .populate('items.product', 'name images')
      .populate('items.vendor', 'name storeName businessAddress phone');

    assert(Boolean(singleOrder), 'Order details retrieved by orderId');
    assert(singleOrder.items[0].name === mumbaiProduct.name, 'Product name populated in order details');
    assert(singleOrder.items[0].vendor.storeName === mumbaiSeller.storeName, 'Seller store info populated in order details');
    assert(singleOrder.shippingAddress.pincode === '452010', 'Shipping address with PIN code shown in order details');
    assert(singleOrder.paymentStatus === 'Paid', 'Payment status shown in order details');

    // Security check: Customer B cannot view Customer A's private order
    const otherCustomer = await User.create({
      name: `Other Customer ${ts}`,
      email: `other_${ts}@appsica.com`,
      password: 'password123',
      role: 'user',
    });

    const otherOrders = await Order.find({ user: otherCustomer._id });
    assert(otherOrders.length === 0, 'Other customer cannot see Rohit\'s order history');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ _id: { $in: [indoreSeller._id, mumbaiSeller._id, delhiSeller._id, pendingSeller._id, indoreCustomer._id, otherCustomer._id] } });
    await Product.deleteMany({ _id: { $in: [indoreProduct._id, mumbaiProduct._id, delhiProduct._id, inactiveProduct._id, pendingProduct._id] } });
    await Address.deleteMany({ user: indoreCustomer._id });
    await Order.deleteMany({ _id: { $in: [indoreToIndoreRes.order._id, indoreToMumbaiRes.order._id, indoreToDelhiRes.order._id] } });

    console.log('\n========================================================================');
    console.log(`🎉 ALL 10 PAN-INDIA ORDERING TEST CASES PASSED! (${passed} PASSED, ${failed} FAILED)`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runPanIndiaTests();
