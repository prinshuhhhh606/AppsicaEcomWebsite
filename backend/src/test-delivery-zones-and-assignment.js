/**
 * Comprehensive Automated Test Suite
 * Smart Delivery Zone & Automatic Driver Assignment Engine
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/user');
const Product = require('./models/product');
const Category = require('./models/category');
const Order = require('./models/order');
const DeliveryZone = require('./models/deliveryZone');
const AssignmentAudit = require('./models/assignmentAudit');
const SystemSetting = require('./models/systemSetting');
const GeoService = require('./services/geoService');
const DriverAssignmentService = require('./services/driverAssignmentService');

const runTests = async () => {
  console.log('========================================================================');
  console.log('🧪 SMART DELIVERY ZONE & DRIVER AUTO-ASSIGNMENT COMPREHENSIVE TEST SUITE');
  console.log('========================================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/appsica_ecom';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB for verification\n');

  // Purge lingering test users from previous runs
  await User.deleteMany({ email: { $regex: /driver_(near|far)|seller_zone/ } });

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
    // -------------------------------------------------------------------------
    // TEST 1: Haversine Distance & Driving ETA Calculations
    // -------------------------------------------------------------------------
    console.log('📍 TEST 1: Distance & Spatial Math Calculation...');
    // Mumbai CST (18.9401, 72.8347) to Bandra (19.0596, 72.8295) approx 13.3 km
    const distCstToBandra = GeoService.calculateHaversineDistance(18.9401, 72.8347, 19.0596, 72.8295);
    assert(distCstToBandra >= 12 && distCstToBandra <= 15, `Haversine distance CST to Bandra is ${distCstToBandra} km (expected ~13.3 km)`);

    const etaBike = GeoService.calculateDrivingEta(distCstToBandra, 'bike');
    assert(etaBike.roadDistanceKm > distCstToBandra, `Road distance with circuity is ${etaBike.roadDistanceKm} km > straight ${distCstToBandra} km`);
    assert(etaBike.estimatedMinutes >= 20 && etaBike.estimatedMinutes <= 60, `Estimated bike ETA is ${etaBike.estimatedMinutes} mins`);

    // -------------------------------------------------------------------------
    // TEST 2: Ray-Casting Polygon In/Out Containment
    // -------------------------------------------------------------------------
    console.log('\n📐 TEST 2: Polygon In-Out Ray-Casting Engine...');
    // Define a square polygon in Mumbai Bandra-BKC region:
    // (19.05, 72.82), (19.08, 72.82), (19.08, 72.87), (19.05, 72.87)
    const testPolygon = [
      { lat: 19.05, lng: 72.82 },
      { lat: 19.08, lng: 72.82 },
      { lat: 19.08, lng: 72.87 },
      { lat: 19.05, lng: 72.87 },
    ];

    const pointInside = { lat: 19.065, lng: 72.845 };
    const pointOutside = { lat: 19.12, lng: 72.85 }; // Far north (Andheri)

    const isInside = GeoService.isPointInPolygon(pointInside, testPolygon);
    const isOutside = GeoService.isPointInPolygon(pointOutside, testPolygon);

    assert(isInside === true, 'Point (19.065, 72.845) correctly identified as INSIDE polygon');
    assert(isOutside === false, 'Point (19.12, 72.85) correctly identified as OUTSIDE polygon');

    // -------------------------------------------------------------------------
    // TEST 3: Pincode & City Fallback Geocoding
    // -------------------------------------------------------------------------
    console.log('\n🏙️ TEST 3: Smart Geocoding & Pincode Resolution...');
    const geoMumbai = GeoService.geocodeLocation({ pincode: '400050', city: 'Mumbai' });
    assert(geoMumbai.lat === 19.076 && geoMumbai.lng === 72.8777, 'Pincode 400050 maps to Mumbai base coordinates');

    const geoPune = GeoService.geocodeLocation({ pincode: '411001', city: 'Pune' });
    assert(geoPune.lat === 18.5204 && geoPune.lng === 73.8567, 'Pincode 411001 maps to Pune coordinates');

    const geoExplicit = GeoService.geocodeLocation({ lat: 19.1234, lng: 72.9876, address: 'Custom Pin' });
    assert(geoExplicit.lat === 19.1234 && geoExplicit.lng === 72.9876, 'Explicit GPS coordinates are preserved intact');

    // -------------------------------------------------------------------------
    // TEST 4: Seller Setup & Custom Delivery Zone Creation
    // -------------------------------------------------------------------------
    console.log('\n🏪 TEST 4: Seller Store Setup & Zone Management...');
    const timestamp = Date.now().toString().slice(-4);
    const seller = await User.create({
      name: `Test Seller ${timestamp}`,
      email: `seller_zone_${timestamp}@appsica.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Zone Store ${timestamp}`,
      storeLocation: {
        lat: 19.0760, // Central Mumbai
        lng: 72.8777,
        address: 'Bandra Hub',
        city: 'Mumbai',
        pincode: '400051',
      },
      defaultDeliveryRadiusKm: 8,
      deliveryZonesEnabled: true,
    });
    assert(seller._id !== null, `Seller created: ${seller.storeName}`);

    // Create a 5 km Radius Zone
    const radiusZone = await DeliveryZone.create({
      vendor: seller._id,
      name: 'Local Express (5 km)',
      zoneType: 'radius',
      center: seller.storeLocation,
      radiusKm: 5,
      deliveryFee: 40,
      isActive: true,
    });
    assert(radiusZone._id !== null, `Radius zone "${radiusZone.name}" created`);

    // Create a Polygon Zone covering a specific sector
    const polyZone = await DeliveryZone.create({
      vendor: seller._id,
      name: 'Custom Suburban Polygon',
      zoneType: 'polygon',
      center: seller.storeLocation,
      polygon: testPolygon,
      deliveryFee: 65,
      isActive: true,
    });
    assert(polyZone.polygon.length === 4, `Polygon zone "${polyZone.name}" created with 4 vertices`);

    // -------------------------------------------------------------------------
    // TEST 5: Delivery Eligibility Verification (Inside vs Outside)
    // -------------------------------------------------------------------------
    console.log('\n🎯 TEST 5: Delivery Eligibility Check Inside & Outside Boundaries...');
    // Destination 1: 3 km from store (inside 5 km radius zone)
    const destInside = { lat: 19.060, lng: 72.855, pincode: '400051' };
    const check1 = await GeoService.checkDeliveryEligibility({
      seller,
      destination: destInside,
    });
    assert(check1.eligible === true, `Address inside zone is ELIGIBLE: "${check1.message}"`);
    assert(check1.status === 'available', 'Status returned is "available"');

    // Destination 2: 45 km from store (outside both custom zones and default radius)
    const destFar = { lat: 19.450, lng: 72.800, pincode: '401201' }; // Virar ~45km
    const check2 = await GeoService.checkDeliveryEligibility({
      seller,
      destination: destFar,
    });
    assert(check2.eligible === false, `Address 45 km away is INELIGIBLE: "${check2.message}"`);
    assert(check2.status === 'unavailable', 'Status returned is "unavailable"');

    // -------------------------------------------------------------------------
    // TEST 6: Product-Specific Delivery Restrictions
    // -------------------------------------------------------------------------
    console.log('\n📦 TEST 6: Product-Specific Restrictions Enforcement...');
    const cat = await mongoose.model('Category').findOne() || { _id: new mongoose.Types.ObjectId() };
    const restrictedProduct = await Product.create({
      name: `Fragile Glass Vase ${timestamp}`,
      description: 'Handcrafted delicate fragile decorative glass vase',
      price: 1299,
      category: cat._id,
      vendor: seller._id,
      vendorStatus: 'approved',
      deliveryRestrictions: {
        isRestricted: true,
        maxRadiusKm: 3, // Restrict to 3 km max
        allowedPincodes: ['400051'],
      },
    });

    // Check with destination 4 km away (within seller 5km, but exceeds product 3km restriction)
    const dest4km = { lat: 19.040, lng: 72.860, pincode: '400051' };
    const checkProductRestricted = await GeoService.checkDeliveryEligibility({
      seller,
      product: restrictedProduct,
      destination: dest4km,
    });
    assert(checkProductRestricted.eligible === false, 'Product 3km restriction prevents delivery at 4km distance');

    // -------------------------------------------------------------------------
    // TEST 7: Nearest Driver Selection & Smart Auto-Assignment
    // -------------------------------------------------------------------------
    console.log('\n🛵 TEST 7: Smart Driver Candidate Ranking & Auto-Assignment...');
    // Set seller in Nashik zone to isolate from Mumbai seed drivers
    seller.storeLocation = { lat: 19.9975, lng: 73.7898, address: 'Nashik Logistics Hub', city: 'Nashik', pincode: '422001' };
    await seller.save();

    // Create Driver A (Far: 4.5 km away in Nashik)
    const driverA = await User.create({
      name: `Driver Far ${timestamp}`,
      email: `driver_far_${timestamp}@appsica.com`,
      password: 'delivery123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      currentLocation: { lat: 20.0350, lng: 73.8200, address: 'Nashik North' },
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
    });

    // Create Driver B (Very close: 100m away in Nashik)
    const driverB = await User.create({
      name: `Driver Near ${timestamp}`,
      email: `driver_near_${timestamp}@appsica.com`,
      password: 'delivery123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      currentLocation: { lat: 19.9980, lng: 73.7902, address: 'Nashik Central' },
      vehicleType: 'bike',
      maxConcurrentOrders: 3,
    });

    // Find eligible drivers within 8 km
    const candidates = await DriverAssignmentService.findEligibleDrivers({
      pickupLat: seller.storeLocation.lat,
      pickupLng: seller.storeLocation.lng,
      radiusKm: 8,
      excludedDriverIds: [],
    });

    assert(candidates.length >= 2, `Found ${candidates.length} candidate drivers within 8 km`);
    assert(candidates[0].driver._id.toString() === driverB._id.toString(), 'Nearest driver (Driver B) ranked #1 for dispatch');

    // Create test order
    const order = await Order.create({
      orderId: `ORD-TEST-${timestamp}`,
      invoiceNumber: `INV-TEST-${timestamp}`,
      items: [
        {
          product: restrictedProduct._id,
          name: restrictedProduct.name,
          price: 1299,
          quantity: 1,
          vendor: seller._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine: 'Flat 101, Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
      },
      paymentMethod: 'card',
      paymentStatus: 'Paid',
      orderStatus: 'Packed',
      subtotal: 1299,
      total: 1299,
      deliveryStatus: 'Unassigned',
    });

    // Trigger Auto-Assignment for order
    const assignResult = await DriverAssignmentService.startAutoAssignment(order._id, 'SYSTEM');
    assert(assignResult.success === true, `Auto-assignment successfully dispatched offer`);
    assert(assignResult.status === 'Offer Sent', `Order status is "Offer Sent"`);
    assert(assignResult.offeredTo === driverB.name, `Offer correctly targeted to nearest candidate: ${driverB.name}`);

    // Verify order document in MongoDB
    const updatedOrder = await Order.findById(order._id);
    assert(updatedOrder.deliveryStatus === 'Offer Sent', 'MongoDB order deliveryStatus updated to "Offer Sent"');
    assert(updatedOrder.currentAssignmentOffer.driver.toString() === driverB._id.toString(), 'Current offer points to Driver B');

    // Verify Assignment Audit logged
    const auditOffer = await AssignmentAudit.findOne({ order: order._id, action: 'OFFER_SENT' });
    assert(auditOffer !== null, 'AssignmentAudit recorded OFFER_SENT event in MongoDB');

    // -------------------------------------------------------------------------
    // TEST 8: Driver Rejection & Dynamic Rerouting to Next Candidate
    // -------------------------------------------------------------------------
    console.log('\n🔄 TEST 8: Driver Rejection & Automatic Rerouting...');
    // Driver B declines the offer
    await DriverAssignmentService.handleDriverReject(order._id, driverB._id, 'Flat tyre / unavailable');

    const reroutedOrder = await Order.findById(order._id);
    assert(
      reroutedOrder.currentAssignmentOffer.driver.toString() === driverA._id.toString(),
      `Order automatically re-routed to next closest driver (${driverA.name}) after Driver B declined`
    );

    const auditReject = await AssignmentAudit.findOne({ order: order._id, action: 'OFFER_REJECTED' });
    assert(auditReject !== null, 'OFFER_REJECTED recorded in audit log with decline reason');

    // -------------------------------------------------------------------------
    // TEST 9: Driver Acceptance & Confirmation
    // -------------------------------------------------------------------------
    console.log('\n✅ TEST 9: Driver Acceptance & Atomic Lock...');
    const acceptRes = await DriverAssignmentService.handleDriverAccept(order._id, driverA._id);
    assert(acceptRes.success === true, 'Driver A successfully accepted the delivery assignment');

    const confirmedOrder = await Order.findById(order._id);
    assert(confirmedOrder.deliveryStatus === 'Accepted', 'Order deliveryStatus confirmed as "Accepted"');
    assert(confirmedOrder.deliveryPartner.toString() === driverA._id.toString(), 'Order assigned to Driver A');

    // -------------------------------------------------------------------------
    // TEST 10: Clean-Up Test Fixtures
    // -------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test artifacts...');
    await Order.findByIdAndDelete(order._id);
    await Product.findByIdAndDelete(restrictedProduct._id);
    await DeliveryZone.deleteMany({ vendor: seller._id });
    await User.deleteMany({ _id: { $in: [seller._id, driverA._id, driverB._id] } });
    await AssignmentAudit.deleteMany({ order: order._id });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('\n❌ Test Suite encountered an error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
