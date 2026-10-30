/**
 * Targeted Automated Test Suite
 * Order Placement, Payment Verification, and GeoService Delivery Validation
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/user');
const Product = require('./models/product');
const Category = require('./models/category');
const Order = require('./models/order');
const Payment = require('./models/payment');
const DeliveryZone = require('./models/deliveryZone');
const CheckoutService = require('./services/checkoutService');
const GeoService = require('./services/geoService');

const runTests = async () => {
  console.log('========================================================================');
  console.log('🧪 CHECKOUT ORDER PLACEMENT & GEOSERVICE COMPREHENSIVE TEST SUITE');
  console.log('========================================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/appsica_ecom';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB for verification\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, title) => {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${title}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  };

  const testSuffix = Math.floor(Math.random() * 10000);

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP TEST ENTITIES (Customer, Seller, Product, Category)
    // -------------------------------------------------------------------------
    console.log('📦 TEST 1: Setup Test Customer, Seller & Inventory...');

    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Electronics', slug: `electronics-${testSuffix}` });
    }

    const customer = await User.create({
      name: 'Prinshuh Test',
      email: `customer_${testSuffix}@example.com`,
      phone: '7725057606',
      password: 'Password123!',
      role: 'user',
      isVerified: true,
    });

    // Seller located in Vadodara, Gujarat
    const seller = await User.create({
      name: `Seller Store ${testSuffix}`,
      email: `seller_${testSuffix}@example.com`,
      phone: '9876543210',
      password: 'Password123!',
      role: 'vendor',
      vendorStatus: 'approved',
      isVerified: true,
      storeName: `Appsica Tech Hub ${testSuffix}`,
      storeLocation: {
        lat: 22.3072,
        lng: 73.1812,
        address: 'Alkapuri Main Road, Vadodara, Gujarat',
      },
      defaultDeliveryRadiusKm: 15,
    });

    const product = await Product.create({
      name: `Wireless Earbuds Pro ${testSuffix}`,
      slug: `earbuds-pro-${testSuffix}`,
      description: 'Noise cancelling premium earbuds',
      price: 1499,
      category: category._id,
      vendor: seller._id,
      vendorStatus: 'approved',
      isActive: true,
      stock: 50,
      images: ['https://example.com/earbuds.jpg'],
    });

    assert(customer._id && seller._id && product._id, 'Customer, seller and product created successfully');

    // -------------------------------------------------------------------------
    // 2. SUCCESSFUL ORDER PLACEMENT (Simulating User Payload)
    // -------------------------------------------------------------------------
    console.log('\n💳 TEST 2: Successful Order Placement with Razorpay & GeoService...');

    const userPayload = {
      userId: customer._id,
      user: customer,
      items: [
        {
          product: product._id,
          quantity: 2,
        },
      ],
      shippingAddress: {
        fullName: 'prinshuh',
        phone: '7725057606',
        addressLine: 'alkapuri',
        city: 'vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      paymentMethod: 'razorpay',
      paymentStatus: 'Paid',
      transactionId: `TXN-RZP-${testSuffix}-TEST1`,
      couponCode: null,
    };

    // This must not throw ReferenceError: GeoService is not defined!
    const result = await CheckoutService.verifyPaymentAndCreateOrder(userPayload);

    assert(result && result.order, 'Order created successfully without reference errors');
    assert(result.isDuplicate === false, 'isDuplicate flag is false for new order');
    assert(result.order.paymentStatus === 'Paid', 'Order paymentStatus is "Paid"');
    assert(result.order.total === 1499 * 2, `Order total is calculated correctly (expected ₹2998, got ₹${result.order.total})`);
    assert(result.order.shippingCoordinates && typeof result.order.shippingCoordinates.lat === 'number', 'shippingCoordinates.lat is defined and numeric');
    assert(result.order.shippingCoordinates && typeof result.order.shippingCoordinates.lng === 'number', 'shippingCoordinates.lng is defined and numeric');
    console.log(`    Order #${result.order.orderId} shipping coordinates:`, result.order.shippingCoordinates);

    // Verify inventory decrement
    const productAfter = await Product.findById(product._id);
    assert(productAfter.stock === 48, `Inventory decremented atomically from 50 to 48 (got: ${productAfter.stock})`);

    // -------------------------------------------------------------------------
    // 3. IDEMPOTENCY ON DUPLICATE TRANSACTION ID
    // -------------------------------------------------------------------------
    console.log('\n🔁 TEST 3: Idempotency Protection on Duplicate Transaction Callback...');

    const duplicateResult = await CheckoutService.verifyPaymentAndCreateOrder(userPayload);
    assert(duplicateResult.isDuplicate === true, 'Duplicate submission identified as duplicate');
    assert(duplicateResult.order.orderId === result.order.orderId, 'Returns existing order ID without creating duplicate');

    const productAfterDuplicate = await Product.findById(product._id);
    assert(productAfterDuplicate.stock === 48, 'Inventory was NOT decremented again on duplicate attempt');

    // -------------------------------------------------------------------------
    // 4. FAILED PAYMENT VERIFICATION REJECTION
    // -------------------------------------------------------------------------
    console.log('\n🚫 TEST 4: Rejection of Unverified / Failed Payment Attempts...');

    let paymentFailedThrown = false;
    try {
      await CheckoutService.verifyPaymentAndCreateOrder({
        userId: customer._id,
        user: customer,
        items: [{ product: product._id, quantity: 1 }],
        shippingAddress: userPayload.shippingAddress,
        paymentMethod: 'razorpay',
        paymentStatus: 'failed',
        transactionId: `TXN-FAILED-${testSuffix}`,
      });
    } catch (err) {
      paymentFailedThrown = true;
      assert(err.statusCode === 400, 'Throws HTTP 400 for failed payment');
      assert(err.message.includes('Payment verification failed'), `Error message indicates payment failure: "${err.message}"`);
    }
    assert(paymentFailedThrown, 'Failed payment was blocked from creating an order');

    // -------------------------------------------------------------------------
    // 5. OUT-OF-BOUNDARY DELIVERY REJECTION (Smart Zone Validation)
    // -------------------------------------------------------------------------
    console.log('\n📍 TEST 5: Server-Side Smart Zone Delivery Boundary Rejection...');

    // Restrict seller store to 5km radius
    seller.defaultDeliveryRadiusKm = 5;
    await seller.save();

    // Destination in Kolkata (~1900 km away from Vadodara store)
    let deliveryRejectedThrown = false;
    try {
      await CheckoutService.verifyPaymentAndCreateOrder({
        userId: customer._id,
        user: customer,
        items: [{ product: product._id, quantity: 1 }],
        shippingAddress: {
          fullName: 'Kolkata Customer',
          phone: '9876543210',
          addressLine: 'Park Street',
          city: 'kolkata',
          pincode: '700016',
        },
        paymentMethod: 'razorpay',
        paymentStatus: 'Paid',
        transactionId: `TXN-RZP-${testSuffix}-KOLKATA`,
      });
    } catch (err) {
      deliveryRejectedThrown = true;
      assert(err.statusCode === 400, 'Throws HTTP 400 for out-of-boundary delivery');
      assert(err.message.includes('cannot be delivered to your address'), `Zone rejection message formatted cleanly: "${err.message}"`);
    }
    assert(deliveryRejectedThrown, 'Out-of-boundary order was properly rejected before order creation');

    // -------------------------------------------------------------------------
    // 6. CASH ON DELIVERY (COD) ORDER PLACEMENT
    // -------------------------------------------------------------------------
    console.log('\n💵 TEST 6: Cash on Delivery (COD) Order Placement...');

    const codResult = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: customer._id,
      user: customer,
      items: [{ product: product._id, quantity: 1 }],
      shippingAddress: userPayload.shippingAddress,
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      transactionId: null,
    });

    assert(codResult && codResult.order, 'COD order created successfully');
    assert(codResult.order.paymentStatus === 'Pending', 'COD paymentStatus defaults to "Pending"');
    assert(codResult.order.paymentGateway === 'CashOnDelivery', 'COD paymentGateway is "CashOnDelivery"');
    assert(codResult.order.transactionId.startsWith('COD-ORD-'), `COD transactionId generated automatically: ${codResult.order.transactionId}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test artifacts...');
    await Order.deleteMany({ _id: { $in: [result.order._id, codResult.order._id] } });
    await Payment.deleteMany({ transactionId: { $regex: new RegExp(String(testSuffix)) } });
    await Product.deleteOne({ _id: product._id });
    await User.deleteMany({ _id: { $in: [customer._id, seller._id] } });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} CHECKOUT & GEOSERVICE TESTS PASSED!`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Test execution failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
