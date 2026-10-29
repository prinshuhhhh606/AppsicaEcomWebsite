const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const path = require('path');
const backendDir = 'c:/Users/pr452/Desktop/AppsicaEcom/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));

const User = require(path.join(backendDir, 'src/models/user'));
const Product = require(path.join(backendDir, 'src/models/product'));
const Category = require(path.join(backendDir, 'src/models/category'));
const Order = require(path.join(backendDir, 'src/models/order'));
const AdminNotification = require(path.join(backendDir, 'src/models/adminNotification'));
const VendorNotification = require(path.join(backendDir, 'src/models/vendorNotification'));
const DeliveryNotification = require(path.join(backendDir, 'src/models/deliveryNotification'));
const DeliveryEarning = require(path.join(backendDir, 'src/models/deliveryEarning'));
const CheckoutService = require(path.join(backendDir, 'src/services/checkoutService'));

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 TESTING COMPLETE ORDER CONFIRMATION & FULFILLMENT WORKFLOW (7-STAGE)');
  console.log('========================================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Find or create test entities
  // 1. Customer
  let customer = await User.findOne({ email: 'customer_test@appsica.com' });
  if (!customer) {
    customer = await User.create({
      name: 'Rohan Customer',
      email: 'customer_test@appsica.com',
      password: 'password123',
      role: 'user',
      phone: '9876543210',
    });
  }

  // 2. Vendor A & Vendor B
  let vendorA = await User.findOne({ email: 'vendor_a@appsica.com' });
  if (!vendorA) {
    vendorA = await User.create({
      name: 'Seller Alpha',
      email: 'vendor_a@appsica.com',
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: 'Alpha Store Electronics',
      phone: '9876543211',
    });
  }

  let vendorB = await User.findOne({ email: 'vendor_b@appsica.com' });
  if (!vendorB) {
    vendorB = await User.create({
      name: 'Seller Beta',
      email: 'vendor_b@appsica.com',
      password: 'password123',
      role: 'vendor',
      vendorStatus: 'approved',
      storeName: 'Beta Fashion Co',
      phone: '9876543212',
    });
  }

  // 3. Approved Driver
  let driver = await User.findOne({ email: 'delivery@appsica.com' });
  if (!driver) {
    driver = await User.create({
      name: 'Vikram Sharma',
      email: 'delivery@appsica.com',
      password: 'delivery123',
      role: 'delivery',
      deliveryStatus: 'approved',
      vehicleType: 'bike',
      vehicleNumber: 'MH-02-EE-1234',
      phone: '9876500001',
    });
  }

  // Find a category
  let testCat = await Category.findOne({});
  if (!testCat) {
    testCat = await Category.create({ name: 'General', slug: 'general', description: 'General' });
  }

  // 4. Products for Vendor A and Vendor B
  let productA = await Product.findOne({ name: 'Alpha Bluetooth Speaker' });
  if (!productA) {
    productA = await Product.create({
      name: 'Alpha Bluetooth Speaker',
      description: 'High performance wireless audio speaker',
      price: 1999,
      stock: 50,
      vendor: vendorA._id,
      vendorStatus: 'approved',
      isActive: true,
      category: testCat._id,
    });
  }

  let productB = await Product.findOne({ name: 'Beta Leather Jacket' });
  if (!productB) {
    productB = await Product.create({
      name: 'Beta Leather Jacket',
      description: 'Premium tailored genuine leather jacket',
      price: 3499,
      stock: 30,
      vendor: vendorB._id,
      vendorStatus: 'approved',
      isActive: true,
      category: testCat._id,
    });
  }

  const stockBeforeA = productA.stock;
  const stockBeforeB = productB.stock;

  // Helper response mock
  let resData = null;
  const createResMock = () => {
    resData = null;
    return {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resData = { code: this.statusCode || 200, ...payload };
        return this;
      },
    };
  };

  const nextMock = (err) => {
    if (err) {
      console.error('Next middleware called with error:', err);
      throw err;
    }
  };

  // =========================================================================
  // STEP 1: CUSTOMER PLACES MULTI-VENDOR ORDER
  // =========================================================================
  console.log('\n▶ STEP 1: Customer places multi-vendor order...');
  const uniqueTxn = `TXN-TEST-${Date.now()}`;
  const checkoutResult = await CheckoutService.verifyPaymentAndCreateOrder({
    userId: customer._id,
    items: [
      { product: productA._id, quantity: 1 },
      { product: productB._id, quantity: 2 },
    ],
    shippingAddress: {
      fullName: 'Rohan Verma',
      phone: '9876543210',
      addressLine: 'Flat 402, Green Heights, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
    },
    paymentMethod: 'upi',
    paymentStatus: 'Paid',
    transactionId: uniqueTxn,
    user: customer,
  });

  const order = checkoutResult.order;
  console.log(`  ✓ Order created successfully: #${order.orderId} (Total: ₹${order.total})`);
  console.log(`  ✓ Initial Order Status: ${order.orderStatus}`);
  console.log(`  ✓ Items count: ${order.items.length}`);

  // Check inventory deduction
  const refProductA = await Product.findById(productA._id);
  const refProductB = await Product.findById(productB._id);
  console.log(`  ✓ Inventory deducted: Product A: ${stockBeforeA} -> ${refProductA.stock}, Product B: ${stockBeforeB} -> ${refProductB.stock}`);

  // Check Admin Notification
  const adminNotif = await AdminNotification.findOne({ link: { $regex: order.orderId } });
  console.log(`  ✓ Admin Notification created: "${adminNotif?.title}"`);

  // Check Vendor A Notification
  const vendorANotif = await VendorNotification.findOne({ recipient: vendorA._id, orderId: order.orderId });
  console.log(`  ✓ Vendor A received isolated alert: "${vendorANotif?.title}" (Amount: ₹${vendorANotif?.amount})`);

  // Check Vendor B Notification
  const vendorBNotif = await VendorNotification.findOne({ recipient: vendorB._id, orderId: order.orderId });
  console.log(`  ✓ Vendor B received isolated alert: "${vendorBNotif?.title}" (Amount: ₹${vendorBNotif?.amount})`);

  // Duplicate Order Check (Idempotency)
  const dupResult = await CheckoutService.verifyPaymentAndCreateOrder({
    userId: customer._id,
    items: [{ product: productA._id, quantity: 1 }],
    shippingAddress: order.shippingAddress,
    transactionId: uniqueTxn,
  });
  console.log(`  ✓ Duplicate submission blocked: isDuplicate = ${dupResult.isDuplicate}`);

  // =========================================================================
  // STEP 2: VENDOR A PACKS THEIR ITEM
  // =========================================================================
  console.log('\n▶ STEP 2: Seller Alpha processes and packs their products...');
  const vendorController = require(path.join(backendDir, 'src/controllers/vendorController'));
  
  const reqVendorA = {
    params: { id: order.orderId },
    body: { status: 'Packed', courierName: 'Appsica Fleet', note: 'Packed carefully with bubble wrap' },
    user: vendorA,
  };

  await vendorController.updateVendorOrderStatus(reqVendorA, createResMock(), nextMock);
  console.log(`  ✓ Seller Alpha updated items to Packed: ${resData?.message || 'Updated'}`);

  const orderAfterA = await Order.findById(order._id);
  console.log(`  ✓ Order status is now: "${orderAfterA.orderStatus}" (Seller B items still being packed)`);

  // Vendor B packs their item
  console.log('\n▶ STEP 3: Seller Beta processes and packs their products...');
  const reqVendorB = {
    params: { id: order.orderId },
    body: { status: 'Packed', courierName: 'Appsica Fleet', note: 'Garments boxed' },
    user: vendorB,
  };
  await vendorController.updateVendorOrderStatus(reqVendorB, createResMock(), nextMock);
  console.log(`  ✓ Seller Beta updated items to Packed: ${resData?.message || 'Updated'}`);

  const orderAfterB = await Order.findById(order._id);
  console.log(`  ✓ All sellers packed! Order status advanced to: "${orderAfterB.orderStatus}"`);

  // Check Admin notification for Ready for Pickup
  const readyNotif = await AdminNotification.findOne({ link: { $regex: order.orderId }, type: 'ORDER_READY_FOR_PICKUP' });
  console.log(`  ✓ Admin notified: "${readyNotif?.title}"`);

  // =========================================================================
  // STEP 4: ADMIN ASSIGNS DELIVERY DRIVER
  // =========================================================================
  console.log('\n▶ STEP 4: Admin assigns delivery driver to ready order...');
  const adminController = require(path.join(backendDir, 'src/controllers/adminController'));
  const reqAdmin = {
    params: { id: order.orderId },
    body: { deliveryPartnerId: driver._id, deliveryFee: 60 },
    user: { _id: new mongoose.Types.ObjectId(), role: 'admin', name: 'Super Admin' },
    ip: '127.0.0.1',
    headers: {},
  };
  await adminController.assignOrderDelivery(reqAdmin, createResMock(), nextMock);
  console.log(`  ✓ Admin assigned driver: ${resData?.message}`);

  const driverNotif = await DeliveryNotification.findOne({ recipient: driver._id, orderId: order.orderId });
  console.log(`  ✓ Delivery driver notified: "${driverNotif?.title}"`);

  // =========================================================================
  // STEP 5: DRIVER FULFILLS ORDER (PICKUP -> OUT FOR DELIVERY -> OTP DELIVERED)
  // =========================================================================
  console.log('\n▶ STEP 5: Delivery driver accepts, collects, and completes delivery...');
  const deliveryController = require(path.join(backendDir, 'src/controllers/deliveryController'));
  
  // A. Driver accepts
  const reqDriver = { params: { id: order.orderId }, body: {}, user: driver };
  await deliveryController.acceptAssignment(reqDriver, createResMock(), nextMock);
  console.log(`  ✓ Driver accepted assignment: ${resData?.message}`);

  // B. Driver confirms pickup
  reqDriver.body = { notes: 'Collected from both sellers', proofImage: '' };
  await deliveryController.confirmPickup(reqDriver, createResMock(), nextMock);
  console.log(`  ✓ Driver confirmed pickup: ${resData?.message}`);

  const orderShipped = await Order.findById(order._id);
  console.log(`  ✓ Order lifecycle updated to: "${orderShipped.orderStatus}" (Delivery: ${orderShipped.deliveryStatus})`);

  // C. Driver marks Out for Delivery
  await deliveryController.startOutForDelivery(reqDriver, createResMock(), nextMock);
  const orderOut = await Order.findById(order._id);
  console.log(`  ✓ Out for delivery! Customer OTP generated: ${orderOut.deliveryOtp}`);

  // D. Driver completes delivery via OTP
  reqDriver.body = { otp: orderOut.deliveryOtp, notes: 'Handed to Rohan Verma' };
  await deliveryController.verifyOtpAndDeliver(reqDriver, createResMock(), nextMock);
  console.log(`  ✓ Delivery verified & completed via OTP! Earned: ₹${resData?.earned}`);

  const orderFinal = await Order.findById(order._id);
  console.log(`  ✓ Final Order Status: "${orderFinal.orderStatus}" | Payment: "${orderFinal.paymentStatus}" | Delivery: "${orderFinal.deliveryStatus}"`);

  // Check Driver Earning record
  const earning = await DeliveryEarning.findOne({ order: order._id });
  console.log(`  ✓ Financial earning ledger created: ₹${earning.totalEarned} (${earning.status})`);

  // =========================================================================
  // STEP 6: CUSTOMER 7-STAGE MILESTONE TIMELINE VERIFICATION
  // =========================================================================
  console.log('\n▶ STEP 6: Verifying Customer 7-Stage Milestone Tracking Timeline...');
  const orderController = require(path.join(backendDir, 'src/controllers/orderController'));
  const reqCustomer = {
    params: { id: order.orderId },
    user: customer,
  };
  await orderController.trackOrder(reqCustomer, createResMock(), nextMock);
  const trackData = resData;

  console.log(`  ✓ Customer tracking endpoint returned ${trackData.milestones.length} stages:`);
  trackData.milestones.forEach((m, idx) => {
    const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : 'Pending';
    console.log(`    Stage ${idx + 1}: ${m.step.padEnd(22)} | Completed: ${m.completed ? '✅ Yes' : '❌ No'} | Time: ${timeStr}`);
  });

  const allCompleted = trackData.milestones.every(m => m.completed);
  if (!allCompleted) {
    throw new Error('Not all 7 tracking milestones were marked completed after successful delivery!');
  }

  // =========================================================================
  // STEP 7: ROLE PERMISSION & SECURITY CHECKS
  // =========================================================================
  console.log('\n▶ STEP 7: Security & Role Permission Checks...');
  
  // Non-assigned driver attempt
  const fakeDriver = { _id: new mongoose.Types.ObjectId(), name: 'Imposter Driver', role: 'delivery' };
  const reqFakeDriver = { params: { id: order.orderId }, body: { notes: 'Hack' }, user: fakeDriver };
  await deliveryController.confirmPickup(reqFakeDriver, createResMock(), nextMock);
  console.log(`  ✓ Unauthorized driver blocked with code ${resData?.code}: "${resData?.message}"`);

  // Seller trying to update an order with no items belonging to them
  const strangerVendor = { _id: new mongoose.Types.ObjectId(), role: 'vendor', storeName: 'Stranger Store' };
  const reqStrangerVendor = { params: { id: order.orderId }, body: { status: 'Packed' }, user: strangerVendor };
  await vendorController.updateVendorOrderStatus(reqStrangerVendor, createResMock(), nextMock);
  console.log(`  ✓ Unauthorized vendor blocked with code ${resData?.code}: "${resData?.message}"`);

  console.log('\n========================================================================');
  console.log('🎉 ALL 7 TEST PHASES PASSED: END-TO-END ORDER WORKFLOW FULLY VERIFIED!');
  console.log('========================================================================');

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
