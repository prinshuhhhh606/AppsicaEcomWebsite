/**
 * End-to-End Verification Test: Assigned Orders in Delivery Partner Panel
 * Validates:
 * 1. Seller assigns order to delivery partner -> deliveryPartner saved, orderStatus='Assigned', deliveryStatus='Assigned'
 * 2. Delivery partner retrieves assigned orders -> sees orderId, customer details, pickup address, items, total, assignment time
 * 3. Driver B cannot see Driver A's assigned orders
 * 4. Driver A declines order -> deliveryStatus='Declined', deliveryPartner=null, seller notified via VendorNotification
 * 5. Seller reassigns order to Driver B -> deliveryPartner=Driver B, deliveryStatus='Assigned'
 * 6. Driver B accepts order -> deliveryStatus='Accepted', orderStatus='Accepted', seller notified
 * 7. Duplicate accept prevention & concurrency validation
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./models/user');
const Order = require('./models/order');
const Product = require('./models/product');
const VendorNotification = require('./models/vendorNotification');
const DeliveryNotification = require('./models/deliveryNotification');
const AssignmentAudit = require('./models/assignmentAudit');
const DriverAssignmentService = require('./services/driverAssignmentService');

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

async function runE2ETests() {
  console.log('\n🚀 Starting E2E Verification: Assigned Orders in Delivery Partner Panel...\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB Atlas\n');

    const suffix = Date.now().toString().slice(-5);

    // 1. Setup Seller
    const seller = await User.create({
      name: `Seller ${suffix}`,
      email: `seller_${suffix}@testmail.com`,
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: `Organic Farms ${suffix}`,
      businessAddress: '100 Alkapuri Road, Vadodara, Gujarat',
      storeLocation: {
        lat: 22.3072,
        lng: 73.1812,
        address: '100 Alkapuri Road, Vadodara',
      },
    });

    // 2. Setup Driver A & Driver B
    const driverA = await User.create({
      name: `Rider A ${suffix}`,
      email: `riderA_${suffix}@testmail.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      vehicleType: 'bike',
      vehicleNumber: `GJ-06-AA-${suffix.slice(-4)}`,
      currentLocation: { lat: 22.3080, lng: 73.1820, address: 'Alkapuri, Vadodara' },
    });

    const driverB = await User.create({
      name: `Rider B ${suffix}`,
      email: `riderB_${suffix}@testmail.com`,
      password: 'password123',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      vehicleType: 'scooter',
      vehicleNumber: `GJ-06-BB-${suffix.slice(-4)}`,
      currentLocation: { lat: 22.3090, lng: 73.1830, address: 'Akota, Vadodara' },
    });

    // 3. Setup Product
    const product = await Product.create({
      name: `Farm Fresh Apples ${suffix}`,
      description: 'Crisp and sweet organic apples',
      category: new mongoose.Types.ObjectId(),
      price: 299,
      stock: 100,
      vendor: seller._id,
      vendorStatus: 'approved',
      images: ['https://example.com/apples.jpg'],
    });

    // 4. Setup Order
    const order = await Order.create({
      orderId: `ORD-E2E-${suffix}`,
      invoiceNumber: `INV-E2E-${suffix}`,
      orderStatus: 'Packed',
      deliveryStatus: 'Pending Assignment',
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 2,
          vendor: seller._id,
          itemStatus: 'Packed',
        },
      ],
      shippingAddress: {
        fullName: 'Priya Sharma',
        addressLine: 'Flat 402, Sunshine Heights',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
        phone: '9876543210',
      },
      pickupLocation: {
        lat: 22.3072,
        lng: 73.1812,
        address: seller.businessAddress,
        storeName: seller.storeName,
      },
      subtotal: 598,
      total: 598,
      paymentMethod: 'card',
      paymentStatus: 'Paid',
    });

    console.log('--- TEST 1: Seller Assigns Order to Delivery Partner A ---');
    const assignResult = await DriverAssignmentService.manualAssign(
      order._id,
      driverA._id,
      'SELLER',
      50
    );
    assert(assignResult.success === true, 'DriverAssignmentService.manualAssign succeeds');

    const orderAfterAssign = await Order.findById(order._id);
    assert(
      orderAfterAssign.deliveryPartner.toString() === driverA._id.toString(),
      'Order deliveryPartner is updated to Driver A'
    );
    assert(orderAfterAssign.deliveryStatus === 'Assigned', 'Order deliveryStatus is "Assigned"');
    assert(orderAfterAssign.orderStatus === 'Assigned', 'Order orderStatus is "Assigned"');
    assert(Boolean(orderAfterAssign.deliveryAssignedAt), 'Order deliveryAssignedAt is set');
    assert(orderAfterAssign.deliveryFee === 50, 'Order deliveryFee is 50');

    console.log('\n--- TEST 2: Delivery Partner A Fetches Assigned Orders ---');
    // Simulate query used by deliveryController.getAssignedOrders
    const driverAQuery = {
      $or: [{ deliveryPartner: driverA._id }, { deliveryPartner: driverA._id.toString() }],
      deliveryStatus: {
        $in: [
          'Assigned', 'assigned', 'Offer Sent', 'Driver Offer Sent',
          'Accepted', 'accepted', 'Arrived at Pickup', 'Reached Pickup',
          'Picked Up', 'In Transit', 'Out for Delivery',
          'Delivered', 'delivered', 'Delivery Attempt Failed',
        ],
      },
    };
    const driverAOrders = await Order.find(driverAQuery)
      .populate('items.product', 'name images price')
      .populate('items.vendor', 'name storeName phone businessAddress storeLocation')
      .populate('user', 'name phone email');

    assert(driverAOrders.length === 1, 'Driver A receives exactly 1 assigned order');
    const driverAOrd = driverAOrders[0];
    assert(driverAOrd.orderId === order.orderId, 'Order ID matches assigned order');
    assert(driverAOrd.shippingAddress.fullName === 'Priya Sharma', 'Customer name is present');
    assert(driverAOrd.shippingAddress.addressLine === 'Flat 402, Sunshine Heights', 'Delivery address is present');
    assert(driverAOrd.items.length === 1, 'Items list is populated');
    assert(driverAOrd.items[0].name === product.name, 'Item name is correctly populated');
    assert(driverAOrd.total === 598, 'Total amount is correctly populated');
    assert(Boolean(driverAOrd.deliveryAssignedAt), 'Assignment timestamp is present');

    console.log('\n--- TEST 3: Driver B Does NOT See Driver A Assigned Order ---');
    const driverBQuery = {
      $or: [{ deliveryPartner: driverB._id }, { deliveryPartner: driverB._id.toString() }],
      deliveryStatus: {
        $in: [
          'Assigned', 'assigned', 'Offer Sent', 'Driver Offer Sent',
          'Accepted', 'accepted', 'Arrived at Pickup', 'Reached Pickup',
          'Picked Up', 'In Transit', 'Out for Delivery',
          'Delivered', 'delivered', 'Delivery Attempt Failed',
        ],
      },
    };
    const driverBOrders = await Order.find(driverBQuery);
    assert(driverBOrders.length === 0, 'Driver B does NOT see Driver A assigned order');

    console.log('\n--- TEST 4: Driver A Declines the Order ---');
    const declineResult = await DriverAssignmentService.handleDriverReject(
      order._id,
      driverA._id,
      'Vehicle puncture / unavailable'
    );
    assert(declineResult.success === true, 'Driver A decline succeeds');

    const orderAfterDecline = await Order.findById(order._id);
    assert(orderAfterDecline.deliveryStatus === 'Declined', 'Order deliveryStatus is "Declined"');
    assert(orderAfterDecline.orderStatus === 'Declined', 'Order orderStatus is "Declined"');
    assert(orderAfterDecline.deliveryPartner === null, 'Order deliveryPartner is cleared to null');

    // Verify Seller was notified
    const vendorNotif = await VendorNotification.findOne({
      recipient: seller._id,
      orderId: order.orderId,
    });
    assert(Boolean(vendorNotif), 'Seller received VendorNotification about the declined delivery');
    assert(
      vendorNotif?.message.includes('Vehicle puncture'),
      'VendorNotification contains the driver decline reason'
    );

    // Verify Driver A's assigned list no longer shows the order as assigned
    const driverAOrdersAfterDecline = await Order.find({
      $or: [{ deliveryPartner: driverA._id }, { deliveryPartner: driverA._id.toString() }],
      deliveryStatus: { $in: ['Assigned', 'assigned', 'Offer Sent'] },
    });
    assert(
      driverAOrdersAfterDecline.length === 0,
      'Driver A assigned orders list no longer contains the declined order'
    );

    console.log('\n--- TEST 5: Seller Reassigns Order to Driver B ---');
    const reassignResult = await DriverAssignmentService.manualAssign(
      order._id,
      driverB._id,
      'SELLER',
      60
    );
    assert(reassignResult.success === true, 'DriverAssignmentService.manualAssign to Driver B succeeds');

    const orderAfterReassign = await Order.findById(order._id);
    assert(
      orderAfterReassign.deliveryPartner.toString() === driverB._id.toString(),
      'Order deliveryPartner is now Driver B'
    );
    assert(orderAfterReassign.deliveryStatus === 'Assigned', 'Order deliveryStatus is "Assigned"');
    assert(orderAfterReassign.orderStatus === 'Assigned', 'Order orderStatus is "Assigned"');
    assert(orderAfterReassign.deliveryFee === 60, 'Order deliveryFee updated to 60');

    console.log('\n--- TEST 6: Driver B Fetches Assigned Orders & Accepts ---');
    const driverBOrdersAfterReassign = await Order.find(driverBQuery);
    assert(driverBOrdersAfterReassign.length === 1, 'Driver B now sees the assigned order');
    assert(driverBOrdersAfterReassign[0].orderId === order.orderId, 'Order ID matches for Driver B');

    // Driver B accepts the order
    const acceptResult = await DriverAssignmentService.handleDriverAccept(order._id, driverB._id);
    assert(acceptResult.success === true, 'Driver B accepts assignment successfully');

    const orderAfterAccept = await Order.findById(order._id);
    assert(orderAfterAccept.deliveryStatus === 'Accepted', 'Order deliveryStatus is "Accepted"');
    assert(orderAfterAccept.orderStatus === 'Accepted', 'Order orderStatus is "Accepted"');
    assert(Boolean(orderAfterAccept.deliveryAcceptedAt), 'Order deliveryAcceptedAt is recorded');

    // Verify confirmation notification
    const driverNotif = await DeliveryNotification.findOne({
      recipient: driverB._id,
      orderId: order.orderId,
      type: 'assignment',
    });
    assert(Boolean(driverNotif), 'Driver B received confirmation notification');

    console.log('\n--- TEST 7: Duplicate Acceptance Prevention ---');
    // Driver B tries to accept again
    const dupAcceptResult = await DriverAssignmentService.handleDriverAccept(order._id, driverB._id);
    assert(dupAcceptResult.success === true && dupAcceptResult.message === 'Already accepted', 'Duplicate accept handled gracefully');

    // Another driver (Driver A) tries to accept Driver B accepted order
    let exceptionCaught = false;
    try {
      await DriverAssignmentService.handleDriverAccept(order._id, driverA._id);
    } catch (e) {
      exceptionCaught = true;
    }
    assert(exceptionCaught === true, 'Unauthorized/duplicate accept by another driver correctly rejected with error');

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ _id: { $in: [seller._id, driverA._id, driverB._id] } });
    await Product.deleteMany({ _id: product._id });
    await Order.deleteMany({ _id: order._id });
    await VendorNotification.deleteMany({ recipient: seller._id });
    await DeliveryNotification.deleteMany({ recipient: { $in: [driverA._id, driverB._id] } });
    await AssignmentAudit.deleteMany({ order: order._id });

    console.log('\n==================================================');
    console.log(`📊 E2E Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('E2E Test Execution Error:', err);
    process.exit(1);
  }
}

runE2ETests();

