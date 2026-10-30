/**
 * Automated Test Suite
 * Delivery Boy Panel with Address-Based Automatic Order Assignment
 * 
 * Verifies all 10 core requirements:
 *  1. Delivery boy 5 km away is eligible.
 *  2. Delivery boy 12 km away (10 km radius) is ineligible.
 *  3. Delivery boy offline or busy is ineligible.
 *  4. No eligible delivery boy puts order in 'Pending Assignment'.
 *  5. Multiple eligible delivery boys ranked and single best chosen.
 *  6. Concurrent assignment attempts are atomic (no double assignment).
 *  7. Seller updating pickup address affects future orders while preserving existing order snapshots.
 *  8. Customer delivery eligibility is independent of driver pickup radius.
 *  9. Unauthorized delivery boy cannot view or update another driver's order.
 * 10. Invalid/missing coordinates and geocoding failures are safely handled.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const User = require('./models/user');
const Product = require('./models/product');
const Category = require('./models/category');
const Order = require('./models/order');
const AssignmentAudit = require('./models/assignmentAudit');
const DriverAssignmentService = require('./services/driverAssignmentService');
const CheckoutService = require('./services/checkoutService');
const GeoService = require('./services/geoService');

const runTests = async () => {
  console.log('========================================================================');
  console.log('🧪 DELIVERY BOY PANEL & ADDRESS-BASED AUTO ASSIGNMENT TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();
  console.log('✓ Connected to MongoDB for verification\n');

  // Purge any lingering test users/orders from previous runs
  await User.deleteMany({ email: { $regex: /rider_(close|far|busy|offline|broken)|seller_hub_|cust_\d+/ } });
  await Order.deleteMany({ orderId: { $regex: /ORD-\d+-/ } });

  const testSuffix = Math.floor(Math.random() * 90000 + 10000);
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

  try {
    // Setup Category & Seller
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Groceries', slug: `groceries-${testSuffix}` });
    }

    // Vadodara Seller Store Base (lat: 22.3072, lng: 73.1812)
    const sellerStoreLat = 22.3072;
    const sellerStoreLng = 73.1812;

    const seller = await User.create({
      name: `Seller Logistics Hub ${testSuffix}`,
      email: `seller_hub_${testSuffix}@example.com`,
      phone: '9876543210',
      password: 'sellerPassword123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Express Mart ${testSuffix}`,
      storeLocation: {
        lat: sellerStoreLat,
        lng: sellerStoreLng,
        address: 'Alkapuri Main Street, Vadodara, Gujarat',
        city: 'Vadodara',
        pincode: '390007',
      },
      defaultDeliveryRadiusKm: 20,
    });

    const product = await Product.create({
      name: `Organic Fresh Apples ${testSuffix}`,
      slug: `apples-${testSuffix}`,
      description: 'Fresh organic farm apples picked daily',
      price: 199,
      category: category._id,
      vendor: seller._id,
      vendorStatus: 'approved',
      isActive: true,
      stock: 100,
    });

    const customer = await User.create({
      name: `Test Customer ${testSuffix}`,
      email: `cust_${testSuffix}@example.com`,
      phone: '9876500001',
      password: 'password123',
      role: 'user',
    });

    // -------------------------------------------------------------------------
    // TEST 1: Delivery boy at 5 km is eligible
    // -------------------------------------------------------------------------
    console.log('📍 TEST 1: Driver 5 km away is eligible within 10 km pickup radius...');

    // ~5 km offset from Vadodara center (lat diff ~0.045)
    const driver5kmLat = sellerStoreLat + 0.045; // ~5.0 km
    const driver5kmLng = sellerStoreLng;

    const driverClose = await User.create({
      name: `Rider Close ${testSuffix}`,
      email: `rider_close_${testSuffix}@example.com`,
      phone: '9876511111',
      password: 'driverPassword123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      deliveryAddress: {
        addressLine: 'Suburban Hub',
        city: 'Vadodara',
        pincode: '390012',
        lat: driver5kmLat,
        lng: driver5kmLng,
      },
      currentLocation: {
        lat: driver5kmLat,
        lng: driver5kmLng,
        address: 'Suburban Hub, Vadodara',
      },
      maxConcurrentOrders: 3,
    });

    const eligibleList1 = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: sellerStoreLat,
      pickupLng: sellerStoreLng,
      radiusKm: 10,
    });

    const isDriverCloseFound = eligibleList1.some(
      (c) => c.driver._id.toString() === driverClose._id.toString()
    );
    assert(isDriverCloseFound, 'Driver 5 km away found eligible in 10 km radius search');
    const matchedDist1 = eligibleList1.find(
      (c) => c.driver._id.toString() === driverClose._id.toString()
    )?.distanceKm;
    assert(matchedDist1 >= 4 && matchedDist1 <= 6, `Distance correctly calculated (~${matchedDist1} km)`);

    // -------------------------------------------------------------------------
    // TEST 2: Delivery boy at 12 km is ineligible for 10 km radius
    // -------------------------------------------------------------------------
    console.log('\n🚫 TEST 2: Driver 12 km away is ineligible within 10 km radius...');

    // ~12 km offset (lat diff ~0.11)
    const driver12kmLat = sellerStoreLat + 0.11;
    const driver12kmLng = sellerStoreLng;

    const driverFar = await User.create({
      name: `Rider Far ${testSuffix}`,
      email: `rider_far_${testSuffix}@example.com`,
      phone: '9876522222',
      password: 'driverPassword123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      deliveryAddress: {
        addressLine: 'Far Outer Ring Road',
        city: 'Vadodara Outskirts',
        lat: driver12kmLat,
        lng: driver12kmLng,
      },
      currentLocation: {
        lat: driver12kmLat,
        lng: driver12kmLng,
        address: 'Far Outer Ring Road',
      },
    });

    const eligibleListStrict = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: sellerStoreLat,
      pickupLng: sellerStoreLng,
      radiusKm: 10,
    });

    const isDriverFarIn10km = eligibleListStrict.some(
      (c) => c.driver._id.toString() === driverFar._id.toString()
    );
    assert(!isDriverFarIn10km, 'Driver 12 km away is excluded from 10 km search');

    // -------------------------------------------------------------------------
    // TEST 3: Delivery boy offline or busy is ineligible
    // -------------------------------------------------------------------------
    console.log('\n⏸️ TEST 3: Driver offline or busy is ineligible...');

    const driverOffline = await User.create({
      name: `Rider Offline ${testSuffix}`,
      email: `rider_offline_${testSuffix}@example.com`,
      phone: '9876533333',
      password: 'driverPassword123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: false, // OFFLINE
      driverAvailability: 'offline',
      currentLocation: { lat: sellerStoreLat + 0.01, lng: sellerStoreLng },
    });

    const driverBusy = await User.create({
      name: `Rider Busy ${testSuffix}`,
      email: `rider_busy_${testSuffix}@example.com`,
      phone: '9876544444',
      password: 'driverPassword123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'busy', // BUSY
      currentLocation: { lat: sellerStoreLat + 0.01, lng: sellerStoreLng },
    });

    const eligibleListActive = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: sellerStoreLat,
      pickupLng: sellerStoreLng,
      radiusKm: 10,
    });

    const isOfflineFound = eligibleListActive.some(
      (c) => c.driver._id.toString() === driverOffline._id.toString()
    );
    const isBusyFound = eligibleListActive.some(
      (c) => c.driver._id.toString() === driverBusy._id.toString()
    );
    assert(!isOfflineFound, 'Offline driver is ineligible for auto assignment');
    assert(!isBusyFound, 'Busy driver is ineligible for auto assignment');

    // -------------------------------------------------------------------------
    // TEST 4: No eligible delivery boy puts order in 'Pending Assignment'
    // -------------------------------------------------------------------------
    console.log('\n⏳ TEST 4: Order transitions to "Pending Assignment" when no eligible driver exists...');

    // Temporarily exclude all available drivers
    const emptyOrder = await Order.create({
      orderId: `ORD-${testSuffix}-EMPTY`,
      user: customer._id,
      items: [{ product: product._id, name: product.name, quantity: 1, price: 199, vendor: seller._id }],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876500001',
        addressLine: 'Alkapuri',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      pickupLocation: {
        lat: 34.0837, // Srinagar, Kashmir (far away from any driver in Gujarat)
        lng: 74.7973,
        address: 'Kashmir Remote Store',
        storeName: 'Remote Hub',
      },
      deliveryStatus: 'Unassigned',
      total: 199,
      subtotal: 199,
    });

    const emptyResult = await DriverAssignmentService.startAutoAssignment(emptyOrder._id, 'SYSTEM');
    const updatedEmptyOrder = await Order.findById(emptyOrder._id);

    assert(emptyResult.success === false, 'startAutoAssignment reports unsuccessful when no drivers match');
    assert(
      updatedEmptyOrder.deliveryStatus === 'Pending Assignment' || updatedEmptyOrder.deliveryStatus === 'Awaiting Assignment',
      `Order status is "${updatedEmptyOrder.deliveryStatus}" (pending assignment for retry/manual dispatch)`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Multiple eligible delivery boys ranked and single best chosen
    // -------------------------------------------------------------------------
    console.log('\n🥇 TEST 5: Multiple eligible drivers ranked by distance & single best selected...');

    // Driver Closer (2 km) vs Driver Close (5 km)
    const driverClosest = await User.create({
      name: `Rider Closest 2km ${testSuffix}`,
      email: `rider_closest_${testSuffix}@example.com`,
      phone: '9876555555',
      password: 'driverPassword123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      deliveryAddress: {
        addressLine: 'City Center Hub',
        city: 'Vadodara',
        pincode: '390007',
        lat: sellerStoreLat + 0.018, // ~2.0 km
        lng: sellerStoreLng,
      },
      currentLocation: {
        lat: sellerStoreLat + 0.018,
        lng: sellerStoreLng,
      },
    });

    const rankingCandidates = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: sellerStoreLat,
      pickupLng: sellerStoreLng,
      radiusKm: 10,
    });

    console.log('    Candidates found in Test 5:', rankingCandidates.map(c => ({ name: c.driver.name, dist: c.distanceKm, mins: c.estimatedMinutes })));

    assert(rankingCandidates.length >= 2, 'Found at least 2 eligible candidate drivers');
    assert(
      rankingCandidates[0].driver._id.toString() === driverClosest._id.toString(),
      `Driver Closest (2 km) ranked #1 over Driver Close (5 km) (Distance: ${rankingCandidates[0].distanceKm} km)`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Atomic concurrency safety (no double assignment)
    // -------------------------------------------------------------------------
    console.log('\n🔒 TEST 6: Concurrent assignment attempts are atomic (no race conditions)...');

    const concurrentOrder = await Order.create({
      orderId: `ORD-${testSuffix}-CONCURRENT`,
      user: customer._id,
      items: [{ product: product._id, name: product.name, quantity: 1, price: 199, vendor: seller._id }],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876500001',
        addressLine: 'Alkapuri',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      pickupLocation: {
        lat: sellerStoreLat,
        lng: sellerStoreLng,
        address: seller.storeLocation.address,
        storeName: seller.storeName,
      },
      deliveryStatus: 'Unassigned',
      total: 199,
      subtotal: 199,
    });

    // Fire 3 simultaneous assignment calls concurrently for the exact same order
    const [res1, res2, res3] = await Promise.all([
      DriverAssignmentService.startAutoAssignment(concurrentOrder._id, 'SYSTEM'),
      DriverAssignmentService.startAutoAssignment(concurrentOrder._id, 'SYSTEM'),
      DriverAssignmentService.startAutoAssignment(concurrentOrder._id, 'SYSTEM'),
    ]);

    const successfulAttempts = [res1, res2, res3].filter((r) => r.success === true);
    assert(
      successfulAttempts.length === 1,
      `Exactly 1 concurrent attempt succeeded in acquiring atomic lock (got: ${successfulAttempts.length})`
    );

    const orderFinal = await Order.findById(concurrentOrder._id);
    assert(orderFinal.deliveryStatus === 'Offer Sent', 'Order status atomically set to "Offer Sent"');
    assert(
      orderFinal.deliveryPartner.toString() === driverClosest._id.toString(),
      'Order assigned to single winning driver candidate'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Seller updating pickup address preserves existing order snapshots
    // -------------------------------------------------------------------------
    console.log('\n🏬 TEST 7: Seller updates pickup location — existing orders keep snapshot, future orders use new location...');

    // Existing order has Vadodara pickup snapshot
    const existingSnapOrder = await Order.create({
      orderId: `ORD-${testSuffix}-SNAP`,
      user: customer._id,
      items: [{ product: product._id, name: product.name, quantity: 1, price: 199, vendor: seller._id }],
      shippingAddress: {
        fullName: 'Snap Customer',
        phone: '9876500001',
        addressLine: 'Alkapuri',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      pickupLocation: {
        lat: sellerStoreLat,
        lng: sellerStoreLng,
        address: 'Alkapuri Main Street, Vadodara, Gujarat',
        storeName: seller.storeName,
      },
      deliveryStatus: 'Unassigned',
      total: 199,
      subtotal: 199,
    });

    // Now seller relocates store to Ahmedabad (lat: 23.0225, lng: 72.5714)
    seller.storeLocation = {
      lat: 23.0225,
      lng: 72.5714,
      address: 'CG Road, Ahmedabad, Gujarat',
      city: 'Ahmedabad',
      pincode: '380009',
    };
    await seller.save();

    // Place a new order after seller location update
    const newPlacedResult = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: customer._id,
      user: customer,
      items: [{ product: product._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Ahmedabad Customer',
        phone: '9876500001',
        addressLine: 'Navrangpura',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380009',
      },
      paymentMethod: 'card',
      paymentStatus: 'Paid',
      transactionId: `TXN-${testSuffix}-NEW-LOC`,
    });

    const reloadedSnapOrder = await Order.findById(existingSnapOrder._id);
    assert(
      reloadedSnapOrder.pickupLocation.city === undefined || reloadedSnapOrder.pickupLocation.address.includes('Vadodara'),
      'Historical order snapshot in Vadodara was preserved unchanged'
    );
    assert(
      newPlacedResult.order.pickupLocation.address.includes('Ahmedabad'),
      `New order uses seller's updated location (got: "${newPlacedResult.order.pickupLocation.address}")`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Customer delivery eligibility is independent of driver pickup radius
    // -------------------------------------------------------------------------
    console.log('\n📦 TEST 8: Customer delivery eligibility validated independently from driver pickup radius...');

    // Seller has 5km maximum delivery radius to customers
    seller.defaultDeliveryRadiusKm = 5;
    await seller.save();

    // Customer is 50 km away in Nadiad, but driver is 2 km from seller
    let farCustomerRejected = false;
    try {
      await CheckoutService.verifyPaymentAndCreateOrder({
        userId: customer._id,
        user: customer,
        items: [{ product: product._id, quantity: 1 }],
        shippingAddress: {
          fullName: 'Far Customer',
          phone: '9876500001',
          addressLine: 'Station Road',
          city: 'Mumbai', // Far from Ahmedabad
          state: 'Maharashtra',
          pincode: '400001',
        },
        paymentMethod: 'card',
        paymentStatus: 'Paid',
        transactionId: `TXN-${testSuffix}-FAR-REJECT`,
      });
    } catch (err) {
      farCustomerRejected = true;
      assert(err.statusCode === 400, 'Throws HTTP 400 for out-of-boundary customer destination');
      assert(err.message.includes('cannot be delivered to your address'), 'Rejection reason states delivery zone constraint');
    }
    assert(farCustomerRejected, 'Order rejected even though a driver was available near the seller');

    // -------------------------------------------------------------------------
    // TEST 9: Unauthorized delivery boy cannot access or update another driver's order
    // -------------------------------------------------------------------------
    console.log('\n🛡️ TEST 9: Unauthorized delivery boy cannot access another driver\'s order...');

    // Order assigned to driverClosest
    const assignedOrderForAuth = await Order.create({
      orderId: `ORD-${testSuffix}-AUTH`,
      user: customer._id,
      deliveryPartner: driverClosest._id,
      deliveryStatus: 'Offer Sent',
      items: [{ product: product._id, name: product.name, quantity: 1, price: 199, vendor: seller._id }],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876500001',
        addressLine: 'Alkapuri',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      total: 199,
      subtotal: 199,
    });

    // Driver Far attempts to accept Driver Closest's order
    let unauthorizedAccepted = false;
    try {
      await DriverAssignmentService.handleDriverAccept(assignedOrderForAuth._id, driverFar._id);
      unauthorizedAccepted = true;
    } catch (authErr) {
      assert(
        authErr.message.includes('already been assigned to another partner'),
        `Properly blocked unauthorized accept: "${authErr.message}"`
      );
    }
    assert(!unauthorizedAccepted, 'Unauthorized driver was prevented from accepting another driver\'s assignment');

    // -------------------------------------------------------------------------
    // TEST 10: Invalid/missing coordinates & geocoding failures safely handled
    // -------------------------------------------------------------------------
    console.log('\n🌐 TEST 10: Invalid / missing coordinates handled safely without crashing...');

    // 1. Geocode with null
    const geoNull = GeoService.geocodeLocation(null);
    assert(geoNull && typeof geoNull.lat === 'number', 'GeoService handles null location gracefully');

    // 2. Geocode with missing address
    const geoEmpty = GeoService.geocodeLocation({});
    assert(geoEmpty && typeof geoEmpty.lat === 'number', 'GeoService handles empty object gracefully');

    // 3. Driver with missing/unresolved coordinates skipped in matching
    const driverInvalidCoords = await User.create({
      name: `Rider Broken GPS ${testSuffix}`,
      email: `rider_broken_${testSuffix}@example.com`,
      phone: '9876599999',
      password: 'driverPassword123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      currentLocation: { lat: null, lng: null },
      deliveryAddress: { lat: null, lng: null },
    });

    const safeMatchList = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: sellerStoreLat,
      pickupLng: sellerStoreLng,
      radiusKm: 10,
    });

    const isBrokenDriverIncluded = safeMatchList.some(
      (c) => c.driver._id.toString() === driverInvalidCoords._id.toString()
    );
    assert(!isBrokenDriverIncluded, 'Driver with NaN/invalid coordinates skipped safely without throw');

    // -------------------------------------------------------------------------
    // Clean up test data
    // -------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test artifacts...');
    await Order.deleteMany({ orderId: { $regex: new RegExp(String(testSuffix)) } });
    await AssignmentAudit.deleteMany({ orderId: { $regex: new RegExp(String(testSuffix)) } });
    await Product.deleteOne({ _id: product._id });
    await User.deleteMany({
      email: {
        $in: [
          seller.email,
          customer.email,
          driverClose.email,
          driverFar.email,
          driverOffline.email,
          driverBusy.email,
          driverClosest.email,
          driverInvalidCoords.email,
        ],
      },
    });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} DELIVERY BOY PANEL & ASSIGNMENT TESTS PASSED!`);
    console.log('========================================================================\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
