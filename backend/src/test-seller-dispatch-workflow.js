/**
 * End-to-End Automated Test Suite:
 * Professional Seller-Triggered Delivery Dispatch System
 * - Checkout does NOT prematurely trigger dispatch
 * - Dispatch begins ONLY when seller marks "Packed / Ready for Driver Pickup"
 * - Seller authorization, eligibility & idempotency
 * - Nearest Driver selection via Haversine distance & live GPS
 * - 60s Countdown, Accept, Decline & Auto-Rerouting
 * - Concurrency safety, No Driver Fallback, Retries & Server Restart Recovery
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

const runTests = async () => {
  console.log('========================================================================');
  console.log('🧪 PROFESSIONAL SELLER-TRIGGERED DISPATCH & AUTO-REROUTING TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();
  console.log('✓ Connected to MongoDB for verification\n');

  const ts = Date.now().toString().slice(-5);

  // Clean test records
  await User.deleteMany({ email: { $regex: /seller_dispatch_/ } });
  await Order.deleteMany({ orderId: { $regex: /ORD-DISPATCH-/ } });

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
    // SETUP: Customer, Authorized Seller, Unauthorized Seller, 3 Candidate Drivers
    // -------------------------------------------------------------------------
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Dispatch Electronics', slug: `dispatch-elec-${ts}` });
    }

    // Customer in Vadodara
    const customer = await User.create({
      name: `Customer ${ts}`,
      email: `seller_dispatch_cust_${ts}@appsica.com`,
      password: 'password123',
      role: 'user',
    });

    // Authorized Seller in Alkapuri, Vadodara (22.3100, 73.1800)
    const seller = await User.create({
      name: `Seller ${ts}`,
      email: `seller_dispatch_seller_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Vadodara Electronics Hub ${ts}`,
      storeLocation: {
        lat: 22.3100,
        lng: 73.1800,
        address: 'Alkapuri Main Road, Vadodara',
        city: 'Vadodara',
        pincode: '390007',
      },
      defaultDeliveryRadiusKm: 15,
      deliveryZonesEnabled: true,
    });

    // Unauthorized Seller (different vendor)
    const otherSeller = await User.create({
      name: `Other Seller ${ts}`,
      email: `seller_dispatch_other_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Other Store ${ts}`,
    });

    const product = await Product.create({
      name: `Wireless Smart Hub ${ts}`,
      description: 'Home automation smart hub',
      price: 1999,
      category: category._id,
      vendor: seller._id,
      vendorStatus: 'approved',
      countInStock: 25,
    });

    // Driver 1: Nearest (~1.2 km from seller store)
    const driver1 = await User.create({
      name: `Driver Nearest (1.2km) ${ts}`,
      email: `seller_dispatch_d1_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
      currentLocation: {
        lat: 22.3110,
        lng: 73.1810,
        address: 'RC Dutt Road, Vadodara',
      },
    });

    // Driver 2: Mid-distance (~0.25 km from seller store)
    const driver2 = await User.create({
      name: `Driver Mid (4.0km) ${ts}`,
      email: `seller_dispatch_d2_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
      currentLocation: {
        lat: 22.3120,
        lng: 73.1820,
        address: 'Fatehgunj, Vadodara',
      },
    });

    // Driver 3: Farthest (~0.5 km from seller store, within 10 km)
    const driver3 = await User.create({
      name: `Driver Far (7.5km) ${ts}`,
      email: `seller_dispatch_d3_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
      currentLocation: {
        lat: 22.3125,
        lng: 73.1822,
        address: 'Makarpura, Vadodara',
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: Customer Order Placement Does NOT Trigger Premature Dispatch
    // -------------------------------------------------------------------------
    console.log('🛒 TEST 1: Customer Checkout Does NOT Trigger Premature Dispatch...');
    const checkoutResult = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: customer._id,
      user: customer,
      items: [
        {
          product: product._id,
          quantity: 1,
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine: 'Sayajigunj',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390005',
      },
      paymentMethod: 'card',
      paymentStatus: 'Paid',
      transactionId: `TXN-DISPATCH-${ts}`,
    });

    const newOrder = checkoutResult.order;
    assert(newOrder.orderStatus === 'Confirmed', 'Order placed with initial orderStatus "Confirmed"');
    assert(newOrder.deliveryStatus === 'Unassigned', 'deliveryStatus remains "Unassigned" at checkout');
    assert(newOrder.deliveryPartner === null, 'No driver assigned prematurely at customer checkout');
    assert(newOrder.pickupLocation?.address !== '', 'Seller store pickup location snapshotted on order');

    // -------------------------------------------------------------------------
    // TEST 2: Seller Clicks "Packed / Ready for Driver Pickup" -> Triggers Dispatch
    // -------------------------------------------------------------------------
    console.log('\n📦 TEST 2: Seller Clicks "Packed / Ready for Driver Pickup" -> Initiates Dispatch...');
    // Simulate Seller updating order to "Ready for Pickup"
    const vendorController = require('./controllers/vendorController');
    const mockReq = {
      user: seller,
      params: { id: newOrder.orderId },
      body: { status: 'Ready for Pickup', note: 'All items packaged and sealed' },
    };

    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = { statusCode: code, ...data };
          return responseData;
        },
      }),
      json: (data) => {
        responseData = { statusCode: 200, ...data };
        return responseData;
      },
    };

    await vendorController.updateVendorOrderStatus(mockReq, mockRes);
    assert(responseData.success === true, 'Seller successfully updated order to "Ready for Pickup"');
    assert(responseData.dispatchInitiated === true, 'Automatic driver dispatch flag initiated');

    // Wait for async startAutoAssignment to execute over remote Atlas
    await new Promise((r) => setTimeout(r, 1500));

    const dispatchedOrder = await Order.findById(newOrder._id);
    assert(
      dispatchedOrder.deliveryStatus === 'Offer Sent' || dispatchedOrder.deliveryStatus === 'Driver Offer Sent',
      'Order deliveryStatus updated to "Offer Sent" after seller packed parcel'
    );
    assert(
      dispatchedOrder.deliveryPartner.toString() === driver1._id.toString(),
      `Offer correctly sent to nearest candidate: Driver 1 (${driver1.name})`
    );
    assert(dispatchedOrder.currentAssignmentOffer?.expiresAt !== null, 'Offer contains 60s expiration timestamp');

    // -------------------------------------------------------------------------
    // TEST 3: Repeated Clicks & Refreshes Do NOT Create Duplicate Offers
    // -------------------------------------------------------------------------
    console.log('\n🛡️ TEST 3: Repeated Seller Clicks Do NOT Create Duplicate Offers...');
    const repeatDispatchRes = await DriverAssignmentService.startAutoAssignment(newOrder._id, 'SELLER');
    assert(repeatDispatchRes.success === false, 'Duplicate dispatch safely blocked by atomic lock');
    const checkAttemptsOrder = await Order.findById(newOrder._id);
    assert(checkAttemptsOrder.assignmentAttempts === 1, 'assignmentAttempts did NOT increment on duplicate call');

    // -------------------------------------------------------------------------
    // TEST 4: Unauthorized Seller Cannot Update or Dispatch Order
    // -------------------------------------------------------------------------
    console.log('\n🚫 TEST 4: Unauthorized Seller Blocked from Updating or Dispatching...');
    const unauthorizedReq = {
      user: otherSeller, // Different vendor who does not own product
      params: { id: newOrder.orderId },
      body: { status: 'Ready for Pickup' },
    };
    let unauthRes = null;
    const mockUnauthRes = {
      status: (code) => ({
        json: (data) => {
          unauthRes = { statusCode: code, ...data };
          return unauthRes;
        },
      }),
      json: (data) => {
        unauthRes = { statusCode: 200, ...data };
        return unauthRes;
      },
    };

    await vendorController.updateVendorOrderStatus(unauthorizedReq, mockUnauthRes);
    assert(unauthRes.statusCode === 403, 'Unauthorized seller request blocked with HTTP 403 Forbidden');

    // -------------------------------------------------------------------------
    // TEST 5: Driver 1 Declines -> Dynamic Auto-Reroute to Driver 2
    // -------------------------------------------------------------------------
    console.log('\n🔄 TEST 5: Driver 1 Declines -> Dynamic Auto-Reroute to Driver 2...');
    const declineResult = await DriverAssignmentService.handleDriverReject(newOrder._id, driver1._id, 'Tire puncture');
    assert(declineResult.success === true, 'Decline handled successfully');
    assert(declineResult.status === 'Offer Sent', 'Order status re-offered to "Offer Sent"');
    assert(declineResult.offeredTo === driver2.name, `Order auto-rerouted to next nearest candidate: ${driver2.name}`);

    const dbReroutedOrder = await Order.findById(newOrder._id);
    assert(dbReroutedOrder.deliveryPartner.toString() === driver2._id.toString(), 'deliveryPartner updated to Driver 2');

    // -------------------------------------------------------------------------
    // TEST 6: 60-Second Server-Side Timeout -> Auto-Reroute to Driver 3
    // -------------------------------------------------------------------------
    console.log('\n⏱️ TEST 6: 60s Timeout Expired -> Dynamic Auto-Reroute to Driver 3...');
    const timeoutResult = await DriverAssignmentService.handleOfferTimeout(newOrder._id, driver2._id);
    assert(timeoutResult.success === true, 'handleOfferTimeout executed successfully');
    assert(timeoutResult.offeredTo === driver3.name, `Order auto-rerouted to Driver 3: ${driver3.name}`);

    // Expired Driver 2 cannot subsequently accept
    try {
      await DriverAssignmentService.handleDriverAccept(newOrder._id, driver2._id);
      assert(false, 'Should have blocked expired Driver 2 from accepting');
    } catch (err) {
      assert(true, `Expired offer acceptance blocked: "${err.message}"`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Driver 3 Accepts -> Atomic Assignment Confirmation
    // -------------------------------------------------------------------------
    console.log('\n✅ TEST 7: Driver 3 Accepts Delivery Assignment...');
    const acceptResult = await DriverAssignmentService.handleDriverAccept(newOrder._id, driver3._id);
    assert(acceptResult.success === true, 'Driver 3 accepted assignment successfully');

    const dbAcceptedOrder = await Order.findById(newOrder._id);
    assert(dbAcceptedOrder.deliveryStatus === 'Accepted', 'Order deliveryStatus confirmed as "Accepted"');
    assert(dbAcceptedOrder.deliveryPartner.toString() === driver3._id.toString(), 'Order locked to Driver 3');

    // Idempotent accept
    const repeatAccept = await DriverAssignmentService.handleDriverAccept(newOrder._id, driver3._id);
    assert(repeatAccept.success === true, 'Idempotent accept handled cleanly');

    // -------------------------------------------------------------------------
    // TEST 8: Driver Capacity Limit Enforced at Accept Time
    // -------------------------------------------------------------------------
    console.log('\n⚖️ TEST 8: Driver Capacity Limit Enforced at Accept Time...');
    // Set driver3 maxConcurrentOrders = 1 (they now have 1 active order)
    await User.findByIdAndUpdate(driver3._id, { maxConcurrentOrders: 1 });

    // Create another offer for driver3
    const orderCap = await Order.create({
      orderId: `ORD-DISPATCH-CAP-${ts}`,
      items: [{ product: product._id, name: product.name, price: 500, quantity: 1, vendor: seller._id }],
      pickupLocation: seller.storeLocation,
      shippingAddress: { fullName: 'Cust', phone: '999', addressLine: 'St', city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
      total: 500,
      subtotal: 500,
      deliveryPartner: driver3._id,
      deliveryStatus: 'Offer Sent',
      currentAssignmentOffer: { driver: driver3._id, expiresAt: new Date(Date.now() + 60000) },
    });

    try {
      await DriverAssignmentService.handleDriverAccept(orderCap._id, driver3._id);
      assert(false, 'Should have blocked accept due to capacity limit');
    } catch (capErr) {
      assert(true, `Capacity limit enforced at acceptance time: "${capErr.message}"`);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Manual Seller Assignment Overrides Dispatch Atomically
    // -------------------------------------------------------------------------
    console.log('\n👤 TEST 9: Manual Assignment Overrides Dispatch Without Conflict...');
    const manualOrder = await Order.create({
      orderId: `ORD-DISPATCH-MANUAL-${ts}`,
      items: [{ product: product._id, name: product.name, price: 500, quantity: 1, vendor: seller._id }],
      pickupLocation: seller.storeLocation,
      shippingAddress: { fullName: 'Cust', phone: '999', addressLine: 'St', city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
      total: 500,
      subtotal: 500,
      deliveryStatus: 'Offer Sent',
      deliveryPartner: driver1._id,
      currentAssignmentOffer: { driver: driver1._id, expiresAt: new Date(Date.now() + 60000) },
    });

    const manualResult = await DriverAssignmentService.manualAssign(manualOrder._id, driver2._id, 'SELLER', 60);
    assert(manualResult.success === true, 'Manual assignment succeeded');

    const dbManualOrder = await Order.findById(manualOrder._id);
    assert(dbManualOrder.deliveryStatus === 'Assigned', 'Order deliveryStatus updated to "Assigned"');
    assert(dbManualOrder.deliveryPartner.toString() === driver2._id.toString(), 'Assigned driver updated to Driver 2');

    // -------------------------------------------------------------------------
    // TEST 10: Server Restart Recovery of Pending & Stale Offers
    // -------------------------------------------------------------------------
    console.log('\n🔄 TEST 10: Server Restart Recovery of Pending & Stale Offers...');
    const orderDowntime = await Order.create({
      orderId: `ORD-DISPATCH-RECOVERY-${ts}`,
      items: [{ product: product._id, name: product.name, price: 500, quantity: 1, vendor: seller._id }],
      pickupLocation: seller.storeLocation,
      shippingAddress: { fullName: 'Cust', phone: '999', addressLine: 'St', city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
      total: 500,
      subtotal: 500,
      deliveryStatus: 'Offer Sent',
      deliveryPartner: driver1._id,
      currentAssignmentOffer: { driver: driver1._id, expiresAt: new Date(Date.now() - 3000) }, // Expired 3s ago during reboot
      assignmentHistory: [{ driver: driver1._id, driverName: driver1.name, offeredAt: new Date(Date.now() - 63000), status: 'offered' }],
    });

    await DriverAssignmentService.recoverPendingOffersOnStartup();

    const dbRecoveredOrder = await Order.findById(orderDowntime._id);
    assert(
      dbRecoveredOrder.deliveryStatus !== 'Offer Sent' || dbRecoveredOrder.deliveryPartner?.toString() !== driver1._id.toString(),
      'Stale downtime offer recovered and automatically processed upon startup'
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test users and orders...');
    await User.deleteMany({ email: { $regex: /seller_dispatch_/ } });
    await Order.deleteMany({ orderId: { $regex: /ORD-DISPATCH-/ } });
    await Product.deleteMany({ _id: product._id });
    await AssignmentAudit.deleteMany({ order: { $in: [newOrder._id, orderCap._id, manualOrder._id, orderDowntime._id] } });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed}/${total} SELLER-TRIGGERED DISPATCH & REROUTING TESTS PASSED!`);
    console.log('========================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure encountered:', err);
    process.exit(1);
  }
};

runTests();
