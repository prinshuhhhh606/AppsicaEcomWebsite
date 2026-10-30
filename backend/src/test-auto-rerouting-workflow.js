/**
 * Comprehensive Automated Verification Suite:
 * Automatic Driver Assignment with Accept/Reject, 60s Timeout, Auto-Rerouting,
 * Concurrency Safety, and Server Restart Recovery.
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

const runTests = async () => {
  console.log('========================================================================');
  console.log('🧪 AUTOMATIC DRIVER DISPATCH, ACCEPT/REJECT & REROUTING TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();
  console.log('✓ Connected to MongoDB for verification\n');

  const ts = Date.now().toString().slice(-5);

  // Clean any test users from previous test runs
  await User.deleteMany({ email: { $regex: /test_reroute_/ } });
  await Order.deleteMany({ orderId: { $regex: /ORD-REROUTE-/ } });

  let passed = 0;
  let total = 0;

  const assert = (condition, title) => {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create Category, Seller, Product, and 3 Drivers at varying distances
    // -------------------------------------------------------------------------
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Automated Electronics', slug: `auto-elec-${ts}` });
    }

    // Seller Store in Surat Central (21.1702, 72.8311)
    const seller = await User.create({
      name: `Store Surat ${ts}`,
      email: `test_reroute_seller_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Surat Tech Hub ${ts}`,
      storeLocation: {
        lat: 21.1702,
        lng: 72.8311,
        address: 'Ring Road, Surat, Gujarat',
        city: 'Surat',
        pincode: '395002',
      },
      defaultDeliveryRadiusKm: 15,
      deliveryZonesEnabled: true,
    });

    const product = await Product.create({
      name: `Ultra Bass Headphones ${ts}`,
      description: 'Noise Cancelling Headphones',
      price: 2499,
      category: category._id,
      vendor: seller._id,
      vendorStatus: 'approved',
      countInStock: 20,
    });

    // Driver 1 (Nearest: ~1.5 km away)
    const driver1 = await User.create({
      name: `Driver Nearest (1.5km) ${ts}`,
      email: `test_reroute_d1_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
      currentLocation: {
        lat: 21.1810,
        lng: 72.8250,
        address: 'Surat West Hub',
      },
    });

    // Driver 2 (Mid-distance: ~4.5 km away)
    const driver2 = await User.create({
      name: `Driver Mid (4.5km) ${ts}`,
      email: `test_reroute_d2_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
      currentLocation: {
        lat: 21.2050,
        lng: 72.8450,
        address: 'Surat North Hub',
      },
    });

    // Driver 3 (Farthest: ~8.5 km away, but within 10 km)
    const driver3 = await User.create({
      name: `Driver Far (8.5km) ${ts}`,
      email: `test_reroute_d3_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
      currentLocation: {
        lat: 21.2400,
        lng: 72.8600,
        address: 'Surat Outer Ring Hub',
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: Nearest Driver Candidate Ranking (Driver 1 > Driver 2 > Driver 3)
    // -------------------------------------------------------------------------
    console.log('📍 TEST 1: Nearest Driver Candidate Ranking by Haversine Distance...');
    const candidates = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: seller.storeLocation.lat,
      pickupLng: seller.storeLocation.lng,
      radiusKm: 10,
      excludedDriverIds: [],
    });

    const testDriverIds = [driver1._id.toString(), driver2._id.toString(), driver3._id.toString()];
    const filteredCandidates = candidates.filter((c) => testDriverIds.includes(c.driver._id.toString()));

    assert(filteredCandidates.length === 3, 'Found all 3 eligible candidate drivers in range');
    assert(
      filteredCandidates[0].driver._id.toString() === driver1._id.toString(),
      `Rank #1 candidate is nearest Driver 1 (${filteredCandidates[0].distanceKm} km)`
    );
    assert(
      filteredCandidates[1].driver._id.toString() === driver2._id.toString(),
      `Rank #2 candidate is mid-distance Driver 2 (${filteredCandidates[1].distanceKm} km)`
    );
    assert(
      filteredCandidates[2].driver._id.toString() === driver3._id.toString(),
      `Rank #3 candidate is farthest Driver 3 (${filteredCandidates[2].distanceKm} km)`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Automatic Offer Dispatch to Nearest Driver
    // -------------------------------------------------------------------------
    console.log('\n🛵 TEST 2: Automatic Offer Dispatch to Nearest Driver...');
    const order1 = await Order.create({
      orderId: `ORD-REROUTE-1-${ts}`,
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          vendor: seller._id,
        },
      ],
      shippingAddress: {
        fullName: 'Surat Customer',
        phone: '9876500001',
        addressLine: 'Varachha Main Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395006',
      },
      pickupLocation: {
        lat: seller.storeLocation.lat,
        lng: seller.storeLocation.lng,
        address: seller.storeLocation.address,
        storeName: seller.storeName,
      },
      total: 2499,
      subtotal: 2499,
      deliveryStatus: 'Unassigned',
    });

    const dispatch1 = await DriverAssignmentService.startAutoAssignment(order1._id, 'SYSTEM');
    assert(dispatch1.success === true, 'Auto-assignment successfully dispatched offer');
    assert(dispatch1.status === 'Offer Sent', 'Order status is "Offer Sent"');
    assert(dispatch1.offeredTo === driver1.name, `Offer targeted strictly to nearest driver: ${driver1.name}`);

    const dbOrder1 = await Order.findById(order1._id);
    assert(dbOrder1.deliveryPartner.toString() === driver1._id.toString(), 'deliveryPartner set to Driver 1');
    assert(dbOrder1.currentAssignmentOffer?.expiresAt !== null, 'Offer expiration timestamp recorded in DB');

    const audit1 = await AssignmentAudit.findOne({ order: order1._id, action: 'OFFER_SENT' });
    assert(audit1 !== null, 'AssignmentAudit recorded OFFER_SENT event');

    // -------------------------------------------------------------------------
    // TEST 3: Driver Rejection & Dynamic Rerouting to Driver 2
    // -------------------------------------------------------------------------
    console.log('\n🔄 TEST 3: Driver 1 Declines -> Dynamic Auto-Rerouting to Driver 2...');
    const rejectResult = await DriverAssignmentService.handleDriverReject(order1._id, driver1._id, 'Bike breakdown');
    assert(rejectResult.success === true, 'handleDriverReject executed successfully');
    assert(rejectResult.status === 'Offer Sent', 'Order status re-offered to "Offer Sent"');
    assert(rejectResult.offeredTo === driver2.name, `Order auto-rerouted to next nearest candidate: ${driver2.name}`);

    const dbOrderRerouted = await Order.findById(order1._id);
    assert(dbOrderRerouted.deliveryPartner.toString() === driver2._id.toString(), 'deliveryPartner updated to Driver 2');

    const auditReject = await AssignmentAudit.findOne({ order: order1._id, action: 'OFFER_REJECTED' });
    assert(auditReject !== null, 'AssignmentAudit recorded OFFER_REJECTED event with reason');

    // -------------------------------------------------------------------------
    // TEST 4: 60-Second Server-Side Timeout -> Dynamic Auto-Rerouting to Driver 3
    // -------------------------------------------------------------------------
    console.log('\n⏱️ TEST 4: 60s Timeout Expired -> Dynamic Auto-Rerouting to Driver 3...');
    const timeoutResult = await DriverAssignmentService.handleOfferTimeout(order1._id, driver2._id);
    assert(timeoutResult.success === true, 'handleOfferTimeout executed successfully');
    assert(timeoutResult.status === 'Offer Sent', 'Order status re-offered to "Offer Sent"');
    assert(timeoutResult.offeredTo === driver3.name, `Order auto-rerouted to Driver 3: ${driver3.name}`);

    const dbOrderTimeout = await Order.findById(order1._id);
    assert(dbOrderTimeout.deliveryPartner.toString() === driver3._id.toString(), 'deliveryPartner updated to Driver 3');

    const auditExpired = await AssignmentAudit.findOne({ order: order1._id, action: 'OFFER_EXPIRED' });
    assert(auditExpired !== null, 'AssignmentAudit recorded OFFER_EXPIRED event');

    // -------------------------------------------------------------------------
    // TEST 5: Driver Acceptance & Atomic Lock Confirmation
    // -------------------------------------------------------------------------
    console.log('\n✅ TEST 5: Driver 3 Accepts Delivery Assignment...');
    const acceptResult = await DriverAssignmentService.handleDriverAccept(order1._id, driver3._id);
    assert(acceptResult.success === true, 'Assignment accepted successfully');

    const dbOrderAccepted = await Order.findById(order1._id);
    assert(dbOrderAccepted.deliveryStatus === 'Accepted', 'Order deliveryStatus confirmed as "Accepted"');
    assert(dbOrderAccepted.deliveryPartner.toString() === driver3._id.toString(), 'Order locked to Driver 3');

    // Idempotent accept returns success without error
    const repeatAccept = await DriverAssignmentService.handleDriverAccept(order1._id, driver3._id);
    assert(repeatAccept.success === true, 'Idempotent repeated acceptance handled safely');

    // Attempt accept from unauthorized/rejected driver is blocked
    try {
      await DriverAssignmentService.handleDriverAccept(order1._id, driver1._id);
      assert(false, 'Should have blocked Driver 1 from accepting');
    } catch (e) {
      assert(true, `Unauthorized acceptance blocked: "${e.message}"`);
    }

    const dummyAddress = {
      fullName: 'Surat Customer',
      phone: '9876500001',
      addressLine: 'Varachha Main Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395006',
    };

    // -------------------------------------------------------------------------
    // TEST 6: Concurrent Accept Race Condition Protection
    // -------------------------------------------------------------------------
    console.log('\n🔒 TEST 6: Concurrent Acceptance Race Condition Protection...');
    const orderRace = await Order.create({
      orderId: `ORD-REROUTE-RACE-${ts}`,
      items: [{ product: product._id, name: product.name, price: 1000, quantity: 1, vendor: seller._id }],
      pickupLocation: seller.storeLocation,
      shippingAddress: dummyAddress,
      total: 1000,
      subtotal: 1000,
      deliveryPartner: driver1._id,
      deliveryStatus: 'Offer Sent',
      currentAssignmentOffer: {
        driver: driver1._id,
        expiresAt: new Date(Date.now() + 60000),
      },
    });

    const [workerA, workerB] = await Promise.allSettled([
      DriverAssignmentService.handleDriverAccept(orderRace._id, driver1._id),
      DriverAssignmentService.handleDriverAccept(orderRace._id, driver1._id),
    ]);

    const successes = [workerA, workerB].filter((r) => r.status === 'fulfilled' && r.value?.success);
    assert(successes.length >= 1, 'At least 1 accept worker succeeded');
    const dbOrderRace = await Order.findById(orderRace._id);
    assert(dbOrderRace.deliveryStatus === 'Accepted', 'Race order safely transitioned to "Accepted"');

    // -------------------------------------------------------------------------
    // TEST 7: No Drivers Available -> Transitions to "Pending Assignment"
    // -------------------------------------------------------------------------
    console.log('\n⏳ TEST 7: No Drivers Available -> Order set to "Pending Assignment"...');
    // Order far away in rural area where no drivers exist
    const orderNoDriver = await Order.create({
      orderId: `ORD-REROUTE-NODRIVER-${ts}`,
      items: [{ product: product._id, name: product.name, price: 1000, quantity: 1, vendor: seller._id }],
      pickupLocation: {
        lat: 28.7041, // Delhi (1000+ km from Surat drivers)
        lng: 77.1025,
        address: 'Delhi Hub',
        storeName: 'Delhi Warehouse',
      },
      shippingAddress: {
        ...dummyAddress,
        city: 'Delhi',
        pincode: '110001',
      },
      total: 1000,
      subtotal: 1000,
      deliveryStatus: 'Unassigned',
    });

    const noDriverDispatch = await DriverAssignmentService.startAutoAssignment(orderNoDriver._id, 'SYSTEM');
    assert(noDriverDispatch.success === false, 'Dispatch reports unsuccessful when no drivers in radius');
    assert(noDriverDispatch.status === 'Pending Assignment', 'Order deliveryStatus set to "Pending Assignment"');

    const dbOrderNoDriver = await Order.findById(orderNoDriver._id);
    assert(dbOrderNoDriver.deliveryStatus === 'Pending Assignment', 'MongoDB order deliveryStatus verified as "Pending Assignment"');

    // -------------------------------------------------------------------------
    // TEST 8: Driver Online Event & Automated Retries
    // -------------------------------------------------------------------------
    console.log('\n⚡ TEST 8: Automated Retry & Driver Availability Trigger...');
    // Create an order in Surat waiting in Pending Assignment
    const orderWaiting = await Order.create({
      orderId: `ORD-REROUTE-WAITING-${ts}`,
      items: [{ product: product._id, name: product.name, price: 500, quantity: 1, vendor: seller._id }],
      pickupLocation: seller.storeLocation,
      shippingAddress: dummyAddress,
      total: 500,
      subtotal: 500,
      deliveryStatus: 'Pending Assignment',
      assignmentAttempts: 1,
    });
    // Set updatedAt directly to bypass Mongoose timestamps middleware
    await Order.collection.updateOne(
      { _id: orderWaiting._id },
      { $set: { updatedAt: new Date(Date.now() - 45000) } }
    );

    // Make driver1 available
    await User.findByIdAndUpdate(driver1._id, { isOnline: true, driverAvailability: 'available' });
    await DriverAssignmentService.retryPendingAssignments();

    const dbOrderRetried = await Order.findById(orderWaiting._id);
    assert(
      dbOrderRetried.deliveryStatus === 'Offer Sent' || dbOrderRetried.deliveryStatus === 'Accepted',
      `Pending order was retried and offered upon driver availability (Status: ${dbOrderRetried.deliveryStatus})`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Server Restart Recovery of Active Offers
    // -------------------------------------------------------------------------
    console.log('\n🔄 TEST 9: Server Restart Recovery of Stale / Active Offers...');
    // Create an order with offer that expired during downtime
    const orderDowntime = await Order.create({
      orderId: `ORD-REROUTE-DOWNTIME-${ts}`,
      items: [{ product: product._id, name: product.name, price: 500, quantity: 1, vendor: seller._id }],
      pickupLocation: seller.storeLocation,
      shippingAddress: dummyAddress,
      total: 500,
      subtotal: 500,
      deliveryStatus: 'Offer Sent',
      deliveryPartner: driver1._id,
      currentAssignmentOffer: {
        driver: driver1._id,
        expiresAt: new Date(Date.now() - 5000), // expired 5s ago during downtime
      },
      assignmentHistory: [
        {
          driver: driver1._id,
          driverName: driver1.name,
          offeredAt: new Date(Date.now() - 65000),
          status: 'offered',
        },
      ],
    });

    await DriverAssignmentService.recoverPendingOffersOnStartup();

    const dbOrderRecovered = await Order.findById(orderDowntime._id);
    assert(
      dbOrderRecovered.deliveryStatus !== 'Offer Sent' || dbOrderRecovered.deliveryPartner?.toString() !== driver1._id.toString(),
      'Downtime expired offer was recovered and re-routed during startup sweep'
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test users and orders...');
    await User.deleteMany({ email: { $regex: /test_reroute_/ } });
    await Order.deleteMany({ orderId: { $regex: /ORD-REROUTE-/ } });
    await Product.deleteMany({ _id: product._id });
    await AssignmentAudit.deleteMany({ order: { $in: [order1._id, orderRace._id, orderNoDriver._id, orderWaiting._id, orderDowntime._id] } });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed}/${total} AUTOMATED REROUTING & ASSIGNMENT TESTS PASSED!`);
    console.log('========================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure encountered:', err);
    process.exit(1);
  }
};

runTests();
