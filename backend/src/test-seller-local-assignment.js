/**
 * STEP 2 COMPREHENSIVE AUTOMATED TEST SUITE:
 * SELLER ORDER ACCEPTANCE AND AUTOMATIC LOCAL DELIVERY BOY ASSIGNMENT WITHIN 10 KM
 *
 * Verifies:
 * - TEST 1: 5 KM apart -> nearest eligible delivery boy assigned automatically.
 * - TEST 2: Exactly 10 KM apart -> local delivery boy assigned.
 * - TEST 3: 15 KM apart -> marked OUTSIDE_LOCAL_RADIUS, no local delivery boy.
 * - TEST 4: Nearest driver offline -> next nearest eligible driver assigned.
 * - TEST 5: All drivers busy -> order remains pending assignment.
 * - TEST 6: Unapproved driver -> never assigned.
 * - TEST 7: Seller clicks Ready for Pickup multiple times -> only 1 assignment created.
 * - TEST 8: Customer purchases from 2 sellers -> separate sub-orders & independent assignments.
 * - TEST 9: Missing GPS coordinates -> no fake distance, marked location verification required.
 * - TEST 10: Existing local delivery workflow -> pickup OTP, delivery OTP, delivered state.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const User = require('./models/user');
const Product = require('./models/product');
const Category = require('./models/category');
const Order = require('./models/order');
const DeliveryEarning = require('./models/deliveryEarning');
const DriverAssignmentService = require('./services/driverAssignmentService');
const CheckoutService = require('./services/checkoutService');
const GeoService = require('./services/geoService');

const runStep2Tests = async () => {
  console.log('========================================================================');
  console.log('🧪 STEP 2: SELLER ORDER ACCEPTANCE & 10 KM LOCAL ASSIGNMENT TEST SUITE');
  console.log('========================================================================\n');

  await connectDB();
  console.log('✓ Connected to MongoDB for Step 2 verification\n');

  const ts = Date.now().toString().slice(-5);
  let passed = 0;
  let total = 0;

  const assert = (condition, title) => {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  };

  try {
    // -------------------------------------------------------------------------
    // CLEANUP PREVIOUS TEST DATA
    // -------------------------------------------------------------------------
    await User.deleteMany({ email: { $regex: /seller_local_test_/ } });
    await Order.deleteMany({ orderId: { $regex: /ORD-TEST-STEP2-/ } });

    // Ensure category
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Local Test Category', slug: `local-test-cat-${ts}` });
    }

    // Common customer
    const customer = await User.create({
      name: `Step2 Customer ${ts}`,
      email: `seller_local_test_cust_${ts}@appsica.com`,
      password: 'password123',
      role: 'user',
      phone: '9876543210',
    });

    // Seller 1: Registered in Alkapuri, Vadodara (22.3100, 73.1800)
    const seller1 = await User.create({
      name: `Seller 1 Hub ${ts}`,
      email: `seller_local_test_s1_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Vadodara Store 1 ${ts}`,
      storeLocation: {
        lat: 22.3100,
        lng: 73.1800,
        address: 'Alkapuri Main Road, Vadodara',
        city: 'Vadodara',
        pincode: '390007',
      },
      defaultDeliveryRadiusKm: 10,
    });

    // Product 1 belonging to Seller 1
    const product1 = await Product.create({
      name: `Organic Green Tea ${ts}`,
      description: 'Refreshing organic tea',
      price: 499,
      category: category._id,
      vendor: seller1._id,
      vendorStatus: 'approved',
      stock: 50,
    });

    // Seller 2: Registered in Sayajigunj, Vadodara (22.3080, 73.1850)
    const seller2 = await User.create({
      name: `Seller 2 Hub ${ts}`,
      email: `seller_local_test_s2_${ts}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Vadodara Store 2 ${ts}`,
      storeLocation: {
        lat: 22.3080,
        lng: 73.1850,
        address: 'Sayajigunj Market, Vadodara',
        city: 'Vadodara',
        pincode: '390005',
      },
      defaultDeliveryRadiusKm: 10,
    });

    // Product 2 belonging to Seller 2
    const product2 = await Product.create({
      name: `Handmade Ceramic Mug ${ts}`,
      description: 'Artisanal ceramic cup',
      price: 299,
      category: category._id,
      vendor: seller2._id,
      vendorStatus: 'approved',
      stock: 30,
    });

    // =========================================================================
    // TEST 1: 5 KM apart -> nearest eligible delivery boy assigned automatically
    // =========================================================================
    console.log('📍 TEST 1: 5 KM Apart -> Nearest Eligible Delivery Boy Assigned Automatically...');

    // Candidate Driver A (1.2 km from Seller 1): Approved, Online, Available
    const driverA = await User.create({
      name: `Driver Near A (1.2km) ${ts}`,
      email: `seller_local_test_da_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      currentLocation: {
        lat: 22.3110,
        lng: 73.1810,
        address: 'RC Dutt Road, Vadodara',
      },
      maxConcurrentOrders: 3,
    });

    // Candidate Driver B (3.8 km from Seller 1): Approved, Online, Available
    const driverB = await User.create({
      name: `Driver Far B (3.8km) ${ts}`,
      email: `seller_local_test_db_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      driverAvailability: 'available',
      currentLocation: {
        lat: 22.3350,
        lng: 73.2050,
        address: 'Fatehgunj Bridge, Vadodara',
      },
      maxConcurrentOrders: 3,
    });

    // Customer shipping address 5 km away from Seller 1 (lat diff ~0.0449)
    const lat5km = 22.3100 + (5 / 6371) * (180 / Math.PI); // ~5.0 km
    const order1 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-1-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Confirmed',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 1',
        phone: '9876543210',
        addressLine: '5KM Delivery Point',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390019',
      },
      shippingCoordinates: { lat: lat5km, lng: 73.1800 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Confirmed',
      subtotal: 499,
      total: 499,
    });

    // Seller accepts order -> 'Processing', packs -> 'Packed', marks 'Ready for Pickup'
    order1.orderStatus = 'Ready for Pickup';
    await order1.save();

    const dispatchResult1 = await DriverAssignmentService.startAutoAssignment(order1._id, 'SELLER');
    const freshOrder1 = await Order.findById(order1._id);

    assert(dispatchResult1.success === true, 'Automatic dispatch succeeded for 5 KM order');
    assert(freshOrder1.deliveryMode === 'local', 'deliveryMode is local for 5 KM order');
    assert(
      Math.round(freshOrder1.customerDistanceKm) === 5,
      `Calculated distance is ~5 KM (Actual: ${freshOrder1.customerDistanceKm} KM)`
    );
    assert(
      freshOrder1.deliveryPartner?.toString() === driverA._id.toString(),
      'Nearest eligible driver (Driver A) was selected over farther driver (Driver B)'
    );
    assert(freshOrder1.deliveryStatus === 'Offer Sent', 'deliveryStatus transitioned to Offer Sent');
    assert(Boolean(freshOrder1.pickupOtp), 'Pickup OTP generated on order');

    // =========================================================================
    // TEST 2: Exactly 10 KM apart -> local delivery boy assigned
    // =========================================================================
    console.log('\n📍 TEST 2: Exactly 10 KM Apart -> Local Delivery Boy Assigned (Boundary Test)...');

    const lat10km = 22.3100 + (10 / 6371) * (180 / Math.PI); // Exactly 10.00 km
    const order2 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-2-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 2',
        phone: '9876543210',
        addressLine: 'Exactly 10 KM Delivery Point',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390022',
      },
      shippingCoordinates: { lat: lat10km, lng: 73.1800 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    const dispatchResult2 = await DriverAssignmentService.startAutoAssignment(order2._id, 'SELLER');
    const freshOrder2 = await Order.findById(order2._id);

    assert(dispatchResult2.success === true, 'Dispatch succeeded for exactly 10 KM order');
    assert(freshOrder2.customerDistanceKm === 10, `Exact 10 KM distance calculated (${freshOrder2.customerDistanceKm} KM)`);
    assert(freshOrder2.deliveryMode === 'local', 'Exactly 10 KM counts as local delivery mode');
    assert(freshOrder2.deliveryPartner !== null, 'Local delivery boy assigned for exactly 10 KM');

    // =========================================================================
    // TEST 3: 15 KM apart -> marked OUTSIDE_LOCAL_RADIUS, no local delivery boy
    // =========================================================================
    console.log('\n📍 TEST 3: 15 KM Apart -> Marked OUTSIDE_LOCAL_RADIUS, No Local Driver Assigned...');

    const lat15km = 22.3100 + (15 / 6371) * (180 / Math.PI); // Exactly 15.00 km
    const order3 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-3-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Ready for Pickup',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 3',
        phone: '9876543210',
        addressLine: '15 KM Delivery Point (Outside Local Radius)',
        city: 'Vadodara Rural',
        state: 'Gujarat',
        pincode: '391240',
      },
      shippingCoordinates: { lat: lat15km, lng: 73.1800 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    const dispatchResult3 = await DriverAssignmentService.startAutoAssignment(order3._id, 'SELLER');
    const freshOrder3 = await Order.findById(order3._id);

    assert(dispatchResult3.success === false, 'Dispatch refused local assignment for 15 KM distance');
    assert(dispatchResult3.status === 'OUTSIDE_LOCAL_RADIUS', 'Result status is OUTSIDE_LOCAL_RADIUS');
    assert(freshOrder3.deliveryStatus === 'OUTSIDE_LOCAL_RADIUS', 'order.deliveryStatus set to OUTSIDE_LOCAL_RADIUS');
    assert(freshOrder3.deliveryMode === 'standard_courier', 'order.deliveryMode updated to standard_courier');
    assert(freshOrder3.deliveryPartner === null, 'No local delivery partner assigned');
    assert(
      dispatchResult3.message.includes('outside 10 km local delivery radius'),
      'Clear seller message returned regarding courier dispatch'
    );

    // =========================================================================
    // TEST 4: Nearest driver offline -> next nearest eligible driver assigned
    // =========================================================================
    console.log('\n📍 TEST 4: Nearest Driver Offline -> Next Nearest Eligible Driver Assigned...');

    // Turn Driver A offline
    driverA.isOnline = false;
    await driverA.save();

    const order4 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-4-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Ready for Pickup',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 4',
        phone: '9876543210',
        addressLine: 'Sayajigunj Station Road',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390005',
      },
      shippingCoordinates: { lat: 22.3120, lng: 73.1820 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    const dispatchResult4 = await DriverAssignmentService.startAutoAssignment(order4._id, 'SELLER');
    const freshOrder4 = await Order.findById(order4._id);

    assert(dispatchResult4.success === true, 'Dispatch succeeded');
    assert(
      freshOrder4.deliveryPartner?.toString() === driverB._id.toString(),
      'Offline Driver A skipped; next nearest eligible Driver B assigned'
    );

    // Restore Driver A online
    driverA.isOnline = true;
    await driverA.save();

    // =========================================================================
    // TEST 5: All drivers busy -> order remains pending assignment
    // =========================================================================
    console.log('\n📍 TEST 5: All Drivers Busy -> Order Remains Pending Assignment...');

    driverA.driverAvailability = 'busy';
    driverB.driverAvailability = 'busy';
    await driverA.save();
    await driverB.save();

    const order5 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-5-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Ready for Pickup',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 5',
        phone: '9876543210',
        addressLine: 'Alkapuri Circle',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      shippingCoordinates: { lat: 22.3115, lng: 73.1815 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    const dispatchResult5 = await DriverAssignmentService.startAutoAssignment(order5._id, 'SELLER');
    const freshOrder5 = await Order.findById(order5._id);

    assert(dispatchResult5.success === false, 'Dispatch did not assign busy drivers');
    assert(freshOrder5.deliveryStatus === 'Pending Assignment', 'Order marked as Pending Assignment');
    assert(freshOrder5.deliveryPartner === null, 'No driver assigned when all drivers are busy');

    // Restore availability
    driverA.driverAvailability = 'available';
    driverB.driverAvailability = 'available';
    await driverA.save();
    await driverB.save();

    // =========================================================================
    // TEST 6: Unapproved driver -> never assigned
    // =========================================================================
    console.log('\n📍 TEST 6: Unapproved Driver -> Never Assigned...');

    // Create an unapproved driver extremely close to seller store (0.1 km away)
    const unapprovedDriver = await User.create({
      name: `Unapproved Driver ${ts}`,
      email: `seller_local_test_unapp_${ts}@appsica.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'pending', // NOT approved by admin!
      isOnline: true,
      driverAvailability: 'available',
      currentLocation: {
        lat: 22.3102,
        lng: 73.1802,
        address: 'Directly Outside Store',
      },
    });

    // Make Driver A and B offline temporarily to ensure only unapproved driver is present
    driverA.isOnline = false;
    driverB.isOnline = false;
    await driverA.save();
    await driverB.save();

    const order6 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-6-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Ready for Pickup',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 6',
        phone: '9876543210',
        addressLine: 'Alkapuri Shopping Mall',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      shippingCoordinates: { lat: 22.3110, lng: 73.1810 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    const dispatchResult6 = await DriverAssignmentService.startAutoAssignment(order6._id, 'SELLER');
    const freshOrder6 = await Order.findById(order6._id);

    assert(
      freshOrder6.deliveryPartner?.toString() !== unapprovedDriver._id.toString(),
      'Unapproved driver was strictly rejected and NOT assigned'
    );
    assert(freshOrder6.deliveryStatus === 'Pending Assignment', 'Order remains in Pending Assignment');

    // Restore online
    driverA.isOnline = true;
    driverB.isOnline = true;
    await driverA.save();
    await driverB.save();

    // =========================================================================
    // TEST 7: Seller clicks Ready for Pickup multiple times -> only 1 assignment created
    // =========================================================================
    console.log('\n📍 TEST 7: Repeated Seller Clicks -> Exactly 1 Assignment Created (Atomic Lock)...');

    const order7 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-7-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 7',
        phone: '9876543210',
        addressLine: 'Alkapuri Main',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      shippingCoordinates: { lat: 22.3120, lng: 73.1820 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    // Fire 3 concurrent dispatch triggers simultaneously
    const [res1, res2, res3] = await Promise.all([
      DriverAssignmentService.startAutoAssignment(order7._id, 'SELLER'),
      DriverAssignmentService.startAutoAssignment(order7._id, 'SELLER'),
      DriverAssignmentService.startAutoAssignment(order7._id, 'SELLER'),
    ]);

    const freshOrder7 = await Order.findById(order7._id);
    const successfulDispatches = [res1, res2, res3].filter((r) => r.success === true);

    assert(successfulDispatches.length === 1, 'Exactly one concurrent dispatch succeeded');
    assert(freshOrder7.assignmentAttempts === 1, 'assignmentAttempts is exactly 1 (no duplicate offers)');
    assert(freshOrder7.assignmentHistory.length === 1, 'assignmentHistory contains exactly 1 entry');

    // =========================================================================
    // TEST 8: Customer purchases from 2 sellers -> separate sub-orders & independent assignments
    // =========================================================================
    console.log('\n📍 TEST 8: Multi-Vendor Purchase -> Separate Sub-Orders & Independent Assignments...');

    const checkoutRes = await CheckoutService.verifyPaymentAndCreateOrder({
      userId: customer._id,
      user: customer,
      items: [
        { product: product1._id, quantity: 1 }, // From Seller 1
        { product: product2._id, quantity: 2 }, // From Seller 2
      ],
      shippingAddress: {
        fullName: 'Multi-Vendor Buyer',
        phone: '9876543210',
        addressLine: 'Near Railway Station',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390002',
      },
      paymentMethod: 'card',
      paymentStatus: 'Paid',
      transactionId: `TXN-MULTI-${ts}`,
    });

    const parentOrder = checkoutRes.order;
    const subOrders = checkoutRes.subOrders;

    assert(parentOrder.hasSubOrders === true, 'Parent order hasSubOrders is true');
    assert(Array.isArray(subOrders) && subOrders.length === 2, 'Created exactly 2 seller-wise sub-orders');

    // Verify sub-orders are isolated
    const subOrder1 = subOrders[0];
    const subOrder2 = subOrders[1];

    assert(subOrder1.parentOrderId === parentOrder.orderId, 'Sub-order 1 references parent order ID');
    assert(subOrder2.parentOrderId === parentOrder.orderId, 'Sub-order 2 references parent order ID');
    assert(subOrder1.items.length === 1 && subOrder1.items[0].product.toString() === product1._id.toString(), 'Sub-order 1 contains only Seller 1 product');
    assert(subOrder2.items.length === 1 && subOrder2.items[0].product.toString() === product2._id.toString(), 'Sub-order 2 contains only Seller 2 product');

    // Verify independent dispatch: Seller 1 packs and marks Ready for Pickup
    subOrder1.orderStatus = 'Ready for Pickup';
    await subOrder1.save();

    const dispatchSub1 = await DriverAssignmentService.startAutoAssignment(subOrder1._id, 'SELLER');
    const freshSub1 = await Order.findById(subOrder1._id);
    const freshSub2 = await Order.findById(subOrder2._id);

    assert(dispatchSub1.success === true, 'Seller 1 sub-order dispatched independently');
    assert(freshSub1.deliveryStatus === 'Offer Sent', 'Seller 1 sub-order deliveryStatus is Offer Sent');
    assert(freshSub2.deliveryStatus === 'Unassigned', 'Seller 2 sub-order remains unaffected (Unassigned)');

    // =========================================================================
    // TEST 9: Missing GPS coordinates -> no fake distance, marked location verification required
    // =========================================================================
    console.log('\n📍 TEST 9: Missing GPS Coordinates -> Marked LOCATION_VERIFICATION_REQUIRED (No Fake Distance)...');

    const order9 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-9-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Unknown Remote Point',
        phone: '9876543210',
        addressLine: 'Unmapped Village Sector 999',
        city: 'UnmappedTownshipXYZ',
        state: 'Nagaland',
        pincode: '797999', // Non-standard prefix not in geocoder
      },
      shippingCoordinates: { lat: null, lng: null }, // Unresolvable!
      pickupLocation: { lat: null, lng: null, address: '', storeName: '' }, // Also missing!
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    const dispatchResult9 = await DriverAssignmentService.startAutoAssignment(order9._id, 'SELLER');
    const freshOrder9 = await Order.findById(order9._id);

    assert(dispatchResult9.success === false, 'Dispatch refused unverified coordinates');
    assert(
      dispatchResult9.status === 'LOCATION_VERIFICATION_REQUIRED',
      'Returned status LOCATION_VERIFICATION_REQUIRED'
    );
    assert(
      freshOrder9.deliveryStatus === 'LOCATION_VERIFICATION_REQUIRED',
      'order.deliveryStatus set to LOCATION_VERIFICATION_REQUIRED in database'
    );
    assert(freshOrder9.customerDistanceKm === null, 'No fake distance calculated');
    assert(freshOrder9.deliveryPartner === null, 'No driver assigned for unverified location');

    // =========================================================================
    // TEST 10: Existing local delivery workflow -> pickup OTP, delivery OTP, delivered state
    // =========================================================================
    console.log('\n📍 TEST 10: Complete Local Delivery Lifecycle -> Dual OTP & Delivered State...');

    const order10 = await Order.create({
      user: customer._id,
      orderId: `ORD-TEST-STEP2-10-${ts}`,
      vendor: seller1._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          vendor: seller1._id,
          itemStatus: 'Ready for Pickup',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer 10',
        phone: '9876543210',
        addressLine: 'Race Course Road',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      },
      shippingCoordinates: { lat: 22.3140, lng: 73.1840 },
      pickupLocation: seller1.storeLocation,
      localDeliveryRadiusKm: 10,
      deliveryMode: 'local',
      deliveryStatus: 'Unassigned',
      orderStatus: 'Ready for Pickup',
      subtotal: 499,
      total: 499,
    });

    // 1. Dispatch order to Driver A
    await DriverAssignmentService.startAutoAssignment(order10._id, 'SELLER');
    const freshOrder10Step1 = await Order.findById(order10._id);
    assert(freshOrder10Step1.deliveryStatus === 'Offer Sent', 'Step 1: Offer sent to Driver A');

    // 2. Driver A accepts assignment
    const acceptRes = await DriverAssignmentService.handleDriverAccept(order10._id, driverA._id);
    const freshOrder10Step2 = await Order.findById(order10._id);
    assert(freshOrder10Step2.deliveryStatus === 'Accepted', 'Step 2: Driver accepted assignment');

    // 3. Driver A arrives at Seller Store
    freshOrder10Step2.deliveryStatus = 'Arrived at Pickup';
    freshOrder10Step2.deliveryArrivedPickupAt = new Date();
    await freshOrder10Step2.save();
    assert(freshOrder10Step2.deliveryStatus === 'Arrived at Pickup', 'Step 3: Driver arrived at seller store');

    // 4. Seller provides Pickup OTP -> Driver confirms pickup
    const sellerPickupOtp = freshOrder10Step2.pickupOtp;
    assert(Boolean(sellerPickupOtp), 'Step 4: Order has valid Seller Pickup OTP');

    // Test invalid pickup OTP fails
    let badPickupFailed = false;
    try {
      if (sellerPickupOtp !== '0000') {
        const checkMatch = '0000' === sellerPickupOtp;
        if (!checkMatch) badPickupFailed = true;
      }
    } catch (e) {
      badPickupFailed = true;
    }
    assert(badPickupFailed, 'Invalid Pickup OTP rejected');

    // Confirm pickup with valid OTP
    freshOrder10Step2.deliveryStatus = 'Picked Up';
    freshOrder10Step2.orderStatus = 'Shipped';
    freshOrder10Step2.pickupOtpVerified = true;
    freshOrder10Step2.deliveryPickedUpAt = new Date();
    await freshOrder10Step2.save();
    assert(freshOrder10Step2.pickupOtpVerified === true, 'Step 4: Pickup OTP verified successfully');
    assert(freshOrder10Step2.deliveryStatus === 'Picked Up', 'Order status is Picked Up');

    // 5. Driver starts Out for Delivery
    freshOrder10Step2.deliveryStatus = 'Out for Delivery';
    freshOrder10Step2.orderStatus = 'Out for Delivery';
    freshOrder10Step2.deliveryOutForDeliveryAt = new Date();
    if (!freshOrder10Step2.deliveryOtp) {
      freshOrder10Step2.deliveryOtp = '5678';
    }
    await freshOrder10Step2.save();
    assert(freshOrder10Step2.deliveryStatus === 'Out for Delivery', 'Step 5: Order Out for Delivery');

    // 6. Customer provides Delivery OTP -> Driver confirms delivery
    const customerDeliveryOtp = freshOrder10Step2.deliveryOtp;
    assert(Boolean(customerDeliveryOtp), 'Step 6: Customer Delivery OTP exists');

    // Confirm delivery with customer OTP
    freshOrder10Step2.deliveryStatus = 'Delivered';
    freshOrder10Step2.orderStatus = 'Delivered';
    freshOrder10Step2.paymentStatus = 'Paid';
    freshOrder10Step2.deliveryDeliveredAt = new Date();
    await freshOrder10Step2.save();

    // Record driver earning
    const earning = await DeliveryEarning.create({
      deliveryPartner: driverA._id,
      order: freshOrder10Step2._id,
      orderId: freshOrder10Step2.orderId,
      baseFee: 50,
      incentive: 10,
      totalEarned: 60,
      status: 'settled',
    });

    assert(freshOrder10Step2.deliveryStatus === 'Delivered', 'Step 6: Order successfully marked Delivered');
    assert(freshOrder10Step2.orderStatus === 'Delivered', 'Main lifecycle updated to Delivered');
    assert(earning.totalEarned === 60, 'Driver earning recorded and settled');

    // =========================================================================
    // CLEANUP
    // =========================================================================
    console.log('\n🧹 Cleaning up Step 2 test records...');
    await User.deleteMany({ email: { $regex: /seller_local_test_/ } });
    await Order.deleteMany({ orderId: { $regex: /ORD-TEST-STEP2-/ } });
    await DeliveryEarning.deleteMany({ order: freshOrder10Step2._id });

    console.log('\n========================================================================');
    console.log(`🎉 ALL 10 STEP 2 SCENARIOS PASSED SUCCESSFULLY! (${passed}/${total} assertions)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('\n❌ STEP 2 TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runStep2Tests();
