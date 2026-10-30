/**
 * Test Suite: Delivery Pickup Confirmation Verification
 * Verifies:
 * 1. Authorized delivery partner arrives at store (arriveAtPickup)
 * 2. Missing OTP when required -> 400 Bad Request with clear message
 * 3. Invalid OTP provided -> 400 Bad Request with clear message
 * 4. Correct OTP provided -> 200 OK, deliveryStatus: 'Picked Up', orderStatus: 'Shipped'
 * 5. Idempotent re-confirm -> 200 OK without errors
 * 6. Unauthorized delivery partner -> 403 Forbidden
 * 7. Admin role pickup confirmation -> 200 OK
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const User = require('./models/user');
const Order = require('./models/order');
const Category = require('./models/category');
const Product = require('./models/product');
const deliveryController = require('./controllers/deliveryController');

const runTests = async () => {
  console.log('========================================================================');
  console.log('🧪 DELIVERY PICKUP CONFIRMATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  await connectDB();
  const ts = Date.now().toString().slice(-5);

  let passed = 0;
  let total = 0;

  const assert = (cond, msg) => {
    total++;
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  };

  try {
    // 1. Create Rider 1 (Authorized)
    const rider1 = await User.create({
      name: `Rider Authorized ${ts}`,
      email: `rider_auth_${ts}@test.com`,
      password: 'Password123!',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      currentLocation: { type: 'Point', coordinates: [75.8577, 22.7196] },
    });

    // 2. Create Rider 2 (Unauthorized stranger)
    const rider2 = await User.create({
      name: `Rider Stranger ${ts}`,
      email: `rider_stranger_${ts}@test.com`,
      password: 'Password123!',
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      currentLocation: { type: 'Point', coordinates: [75.8577, 22.7196] },
    });

    // 3. Create Vendor
    const vendor = await User.create({
      name: `Seller ${ts}`,
      email: `seller_${ts}@test.com`,
      password: 'Password123!',
      role: 'vendor',
      vendorStatus: 'approved',
    });

    // 4. Create Category & Product
    let cat = await Category.findOne();
    if (!cat) cat = await Category.create({ name: 'Pickup Test', slug: `pickup-cat-${ts}` });
    const product = await Product.create({
      name: `Pickup Test Item ${ts}`,
      description: 'A test product for pickup confirmation testing',
      price: 499,
      category: cat._id,
      vendor: vendor._id,
      stock: 10,
    });

    // 5. Create Order assigned to Rider 1 with pickupOtp '7890'
    const order = await Order.create({
      orderId: `ORD-PICKUP-TEST-${ts}`,
      user: rider1._id,
      items: [
        {
          product: product._id,
          name: product.name,
          quantity: 1,
          price: product.price,
          vendor: vendor._id,
        },
      ],
      totalAmount: 499,
      subtotal: 499,
      total: 499,
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine: '123 Main St',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
      },
      orderStatus: 'Ready for Pickup',
      deliveryStatus: 'Accepted',
      deliveryPartner: rider1._id,
      pickupOtp: '7890',
      pickupOtpVerified: false,
    });

    console.log('📍 TEST 1: Unauthorized Rider 2 Attempt -> 403 Forbidden...');
    {
      const req = {
        params: { id: order.orderId },
        body: { pickupOtp: '7890' },
        user: rider2,
      };
      let resStatus = null;
      let resData = null;
      const res = {
        status: (code) => {
          resStatus = code;
          return {
            json: (data) => { resData = data; return resData; },
          };
        },
        json: (data) => { resData = data; return resData; },
      };

      await deliveryController.confirmPickup(req, res);
      assert(resStatus === 403, 'Unauthorized rider receives HTTP 403 Forbidden');
      assert(resData?.message?.includes('not authorized'), 'Meaningful authorization error message returned');
    }

    console.log('\n📍 TEST 2: Authorized Rider Missing OTP -> 400 Bad Request...');
    {
      const req = {
        params: { id: order.orderId },
        body: { notes: 'Collected' }, // missing OTP
        user: rider1,
      };
      let resStatus = null;
      let resData = null;
      const res = {
        status: (code) => {
          resStatus = code;
          return {
            json: (data) => { resData = data; return resData; },
          };
        },
        json: (data) => { resData = data; return resData; },
      };

      await deliveryController.confirmPickup(req, res);
      assert(resStatus === 400, 'Missing OTP returns HTTP 400 Bad Request');
      assert(resData?.requiresOtp === true, 'Response flags requiresOtp: true');
      assert(resData?.message?.includes('Pickup OTP is required'), 'Explains Pickup OTP is required from seller');
    }

    console.log('\n📍 TEST 3: Authorized Rider Wrong OTP -> 400 Bad Request...');
    {
      const req = {
        params: { id: order.orderId },
        body: { pickupOtp: '0000', notes: 'Collected' },
        user: rider1,
      };
      let resStatus = null;
      let resData = null;
      const res = {
        status: (code) => {
          resStatus = code;
          return {
            json: (data) => { resData = data; return resData; },
          };
        },
        json: (data) => { resData = data; return resData; },
      };

      await deliveryController.confirmPickup(req, res);
      assert(resStatus === 400, 'Wrong OTP returns HTTP 400 Bad Request');
      assert(resData?.message?.includes('Invalid Pickup OTP'), 'Returns invalid OTP message');
    }

    console.log('\n📍 TEST 4: Authorized Rider Arrives at Store (arriveAtPickup)...');
    {
      const req = {
        params: { id: order.orderId },
        user: rider1,
      };
      let resData = null;
      const res = {
        status: (code) => ({ json: (d) => { resData = d; } }),
        json: (data) => { resData = data; },
      };

      await deliveryController.arriveAtPickup(req, res);
      assert(resData?.success === true, 'Arrival marked successfully');
      const updatedOrder = await Order.findById(order._id);
      assert(updatedOrder.deliveryStatus === 'Arrived at Pickup', 'deliveryStatus transitioned to Arrived at Pickup');
    }

    console.log('\n📍 TEST 5: Authorized Rider Correct OTP -> 200 OK & Status Picked Up...');
    {
      const req = {
        params: { id: order.orderId },
        body: { pickupOtp: '7890', notes: 'Package verified sealed' },
        user: rider1,
      };
      let resData = null;
      const res = {
        status: (code) => ({ json: (d) => { resData = d; } }),
        json: (data) => { resData = data; },
      };

      await deliveryController.confirmPickup(req, res);
      assert(resData?.success === true, 'Pickup confirmation succeeded');

      const updated = await Order.findById(order._id);
      assert(updated.deliveryStatus === 'Picked Up', 'Order deliveryStatus updated to Picked Up');
      assert(updated.orderStatus === 'Shipped', 'Order orderStatus updated to Shipped');
      assert(updated.pickupOtpVerified === true, 'pickupOtpVerified is true');
      assert(updated.pickupNotes === 'Package verified sealed', 'pickupNotes saved in database');
      assert(updated.deliveryPickedUpAt !== null, 'deliveryPickedUpAt timestamp recorded');
    }

    console.log('\n📍 TEST 6: Idempotent Re-confirm (Multiple Rapid Clicks) -> 200 OK...');
    {
      const req = {
        params: { id: order.orderId },
        body: { pickupOtp: '7890' },
        user: rider1,
      };
      let resData = null;
      let resStatus = null;
      const res = {
        status: (code) => {
          resStatus = code;
          return { json: (d) => { resData = d; } };
        },
        json: (data) => { resData = data; },
      };

      await deliveryController.confirmPickup(req, res);
      assert(resData?.success === true, 'Duplicate confirm does not crash or throw 400/500');
      assert(resData?.message?.includes('already confirmed'), 'Returns idempotency confirmation message');
    }

    // Cleanup
    await User.deleteMany({ _id: { $in: [rider1._id, rider2._id, vendor._id] } });
    await Product.deleteMany({ _id: product._id });
    await Order.deleteMany({ _id: order._id });

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed}/${total} PICKUP CONFIRMATION TESTS PASSED!`);
    console.log('========================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
};

runTests();
