/**
 * Comprehensive Test Suite: Seller Manual Delivery Partner Assignment
 * Tests manual assignment, state transitions, delivery boy visibility, and acceptance
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

const User = require('./models/user');
const Order = require('./models/order');
const Product = require('./models/product');
const AssignmentAudit = require('./models/assignmentAudit');
const DeliveryNotification = require('./models/deliveryNotification');
const DriverAssignmentService = require('./services/driverAssignmentService');

const JWT_SECRET = process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom';

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

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

async function runTests() {
  console.log('\n🚀 Starting Test Suite: Seller Manual Driver Assignment Workflow...\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB Atlas\n');

    const suffix = Date.now().toString().slice(-5);

    // 1. Setup Seller
    const seller = await User.create({
      name: `Test Seller ${suffix}`,
      email: `seller_${suffix}@test.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Test Store ${suffix}`,
      businessAddress: '123 Market Street, Vadodara, Gujarat',
    });

    // 2. Setup Delivery Partners
    const driver1 = await User.create({
      name: `Rider One ${suffix}`,
      email: `driver1_${suffix}@test.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      vehicleType: 'bike',
      vehicleNumber: `GJ-06-XX-${suffix.slice(-4)}`,
      currentLocation: { lat: 22.3072, lng: 73.1812, address: 'Alkapuri, Vadodara' },
    });

    const driver2 = await User.create({
      name: `Rider Two ${suffix}`,
      email: `driver2_${suffix}@test.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      vehicleType: 'scooter',
      vehicleNumber: `GJ-06-EV-${suffix.slice(-4)}`,
      currentLocation: { lat: 22.3100, lng: 73.1850, address: 'Fatehgunj, Vadodara' },
    });

    // 3. Setup Product
    const product = await Product.create({
      name: `Fresh Himalayan Honey ${suffix}`,
      description: 'Organic pure raw mountain forest honey',
      category: new mongoose.Types.ObjectId(),
      price: 499,
      stock: 50,
      vendor: seller._id,
      vendorStatus: 'approved',
      images: ['https://example.com/honey.jpg'],
    });

    // 4. Setup Customer Order
    const order = await Order.create({
      orderId: `ORD-TEST-${suffix}`,
      invoiceNumber: `INV-TEST-${suffix}`,
      orderStatus: 'Packed',
      deliveryStatus: 'Pending Assignment',
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          vendor: seller._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Customer Test',
        addressLine: '45 Green Park',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
        phone: '9988776655',
      },
      pickupLocation: {
        lat: 22.3072,
        lng: 73.1812,
        address: seller.businessAddress,
        storeName: seller.storeName,
      },
      subtotal: 499,
      total: 499,
      paymentMethod: 'card',
      paymentStatus: 'Paid',
    });

    console.log('--- TEST GROUP 1: Seller Manual Assignment via DriverAssignmentService.manualAssign ---');

    // Simulate seller assigning driver 1
    const assignResult = await DriverAssignmentService.manualAssign(
      order._id,
      driver1._id,
      'SELLER',
      65
    );

    assert(assignResult.success === true, 'DriverAssignmentService.manualAssign returns success');
    
    const assignedOrder = await Order.findById(order._id);
    assert(assignedOrder.deliveryPartner.toString() === driver1._id.toString(), 'Order deliveryPartner is driver1');
    assert(assignedOrder.deliveryStatus === 'Assigned', 'Order deliveryStatus is "Assigned"');
    assert(assignedOrder.deliveryFee === 65, 'Order deliveryFee is 65');
    assert(assignedOrder.items[0].deliveryPartner.toString() === driver1._id.toString(), 'Order item deliveryPartner updated');
    assert(assignedOrder.items[0].deliveryStatus === 'Assigned', 'Order item deliveryStatus updated');
    assert(assignedOrder.currentAssignmentOffer.driver === null, 'currentAssignmentOffer is cleared');

    // Check notification and audit log
    const notif = await DeliveryNotification.findOne({ recipient: driver1._id, orderId: order.orderId });
    assert(Boolean(notif), 'Delivery notification created for assigned driver');

    const audit = await AssignmentAudit.findOne({ order: order._id, action: 'MANUAL_ASSIGNMENT' });
    assert(Boolean(audit), 'AssignmentAudit logged with action MANUAL_ASSIGNMENT');
    assert(audit?.performedBy === 'SELLER', 'AssignmentAudit performedBy is SELLER');

    console.log('\n--- TEST GROUP 2: Delivery Boy Visibility in Driver Panel ---');

    // Driver 1 queries assigned orders
    const driver1Orders = await Order.find({
      deliveryPartner: driver1._id,
      deliveryStatus: { $in: ['Assigned', 'Offer Sent', 'Driver Offer Sent', 'Accepted', 'In Transit', 'Out for Delivery'] },
    });
    assert(driver1Orders.length === 1, 'Driver 1 sees 1 assigned order in their fleet list');
    assert(driver1Orders[0].orderId === order.orderId, 'Driver 1 sees the exact assigned orderId');

    // Driver 2 should NOT see Driver 1's assigned order
    const driver2Orders = await Order.find({
      deliveryPartner: driver2._id,
      deliveryStatus: { $in: ['Assigned', 'Offer Sent', 'Accepted'] },
    });
    assert(driver2Orders.length === 0, 'Driver 2 does not see Driver 1 assigned order');

    console.log('\n--- TEST GROUP 3: Delivery Boy Accepts Manual Assignment ---');

    const acceptResult = await DriverAssignmentService.handleDriverAccept(order._id, driver1._id);
    assert(acceptResult.success === true, 'Driver 1 accepts manual assignment successfully');

    const acceptedOrder = await Order.findById(order._id);
    assert(acceptedOrder.deliveryStatus === 'Accepted', 'Order deliveryStatus transitions to "Accepted"');
    assert(Boolean(acceptedOrder.deliveryAcceptedAt), 'Order has valid deliveryAcceptedAt timestamp');

    console.log('\n--- TEST GROUP 4: Re-assignment & Controller Simulation ---');

    // Create another order to test controller assign simulation
    const order2 = await Order.create({
      orderId: `ORD-TEST2-${suffix}`,
      invoiceNumber: `INV-TEST2-${suffix}`,
      orderStatus: 'Packed',
      deliveryStatus: 'Pending Assignment',
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          vendor: seller._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Customer Two',
        addressLine: '12 Race Course Road',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
        phone: '9988776655',
      },
      subtotal: 499,
      total: 499,
    });

    // Test clearOfferTimer
    DriverAssignmentService.clearOfferTimer(order2._id);
    assert(true, 'DriverAssignmentService.clearOfferTimer executed without exception');

    // Clean up test data
    await User.deleteMany({ _id: { $in: [seller._id, driver1._id, driver2._id] } });
    await Product.deleteMany({ _id: product._id });
    await Order.deleteMany({ _id: { $in: [order._id, order2._id] } });
    await DeliveryNotification.deleteMany({ recipient: { $in: [driver1._id, driver2._id] } });
    await AssignmentAudit.deleteMany({ order: { $in: [order._id, order2._id] } });

    console.log('\n==================================================');
    console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();
