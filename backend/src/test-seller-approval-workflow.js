const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 TESTING: ADMIN APPROVAL REQUIRED BEFORE SELLER ACTIVATION');
  console.log('========================================================================\n');

  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const sellerEmail = `test_seller_${randomSuffix}@marketplace.com`;
  const sellerPassword = 'Password@123';
  const storeName = `Zenith Tech Innovations ${randomSuffix}`;

  // ===================================================================
  // STEP 1: Seller Submits Registration
  // ===================================================================
  console.log('▶ STEP 1: Seller submits registration form...');
  const regPayload = {
    name: `Aarav Sharma ${randomSuffix}`,
    email: sellerEmail,
    password: sellerPassword,
    phone: '9876500001',
    storeName,
    storeDescription: 'High quality electronics and audio equipment',
    businessAddress: 'Plot 45, Sector 18, Cyber City, Gurugram, HR - 122002',
    taxId: `06AAACZ${randomSuffix}Z1`,
  };

  const regRes = await axios.post(`${API_BASE}/vendor/register`, regPayload);
  console.log('  Status Code:', regRes.status);
  console.log('  Message:', regRes.data.message);
  console.log('  Vendor Status in DB:', regRes.data.vendorStatus);

  if (
    regRes.status !== 201 ||
    regRes.data.vendorStatus !== 'pending' ||
    !regRes.data.message.includes('Your seller registration request has been submitted. Your account will be activated after admin approval.')
  ) {
    throw new Error('❌ Step 1 Failed: Seller registration did not set pending status or correct message');
  }
  if (regRes.data.token) {
    throw new Error('❌ Step 1 Failed: Token was issued before admin approval!');
  }
  console.log('  ✓ Verified: Status is "pending", no immediate token granted, exact required message received.\n');

  const sellerId = regRes.data.user._id || regRes.data.user.id;

  // ===================================================================
  // STEP 2: Request Appears in Admin Panel
  // ===================================================================
  console.log('▶ STEP 2: Verifying request appears in Admin Panel under Seller Approval Requests...');
  const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'admin@appsica.com',
    password: 'admin123',
  });
  const adminToken = adminLogin.data.token;

  const adminVendorsRes = await axios.get(`${API_BASE}/admin/vendors`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const matchingApp = adminVendorsRes.data.vendors.find(
    (v) => v.email === sellerEmail || v._id.toString() === sellerId.toString()
  );

  if (!matchingApp) {
    throw new Error('❌ Step 2 Failed: Seller application did not appear in admin vendors list');
  }

  console.log('  Found Application in Admin Panel:');
  console.log('  - Store Name:       ', matchingApp.storeName);
  console.log('  - Seller Name:      ', matchingApp.name);
  console.log('  - Email:            ', matchingApp.email);
  console.log('  - Phone:            ', matchingApp.phone);
  console.log('  - Business Address: ', matchingApp.businessAddress);
  console.log('  - Tax ID:           ', matchingApp.taxId);
  console.log('  - Vendor Status:    ', matchingApp.vendorStatus);
  console.log('  - Registration Date:', matchingApp.createdAt);

  if (matchingApp.vendorStatus !== 'pending') {
    throw new Error(`❌ Step 2 Failed: Expected status "pending", found "${matchingApp.vendorStatus}"`);
  }
  console.log('  ✓ Verified: Pending application is visible in Admin Panel with complete business details.\n');

  // ===================================================================
  // STEP 3: Pending Seller Cannot Access Seller Features (Login Blocked)
  // ===================================================================
  console.log('▶ STEP 3: Verifying pending seller cannot access seller features or login...');
  try {
    await axios.post(`${API_BASE}/vendor/login`, {
      email: sellerEmail,
      password: sellerPassword,
    });
    throw new Error('❌ Step 3 Failed: Pending seller was able to log in!');
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log('  ✓ Correctly Rejected Login (HTTP 403 Forbidden):', err.response.data.message);
    } else {
      throw err;
    }
  }

  // ===================================================================
  // STEP 4 & 7: Direct Protected Seller API Requests return 403
  // ===================================================================
  console.log('\n▶ STEP 4 & 7: Testing direct API calls from pending seller...');
  // Forged/temporary token check
  const jwt = require('jsonwebtoken');
  const tempToken = jwt.sign(
    { userId: sellerId },
    process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom',
    { expiresIn: '1h' }
  );

  try {
    await axios.get(`${API_BASE}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    throw new Error('❌ Step 7 Failed: Pending seller accessed dashboard API!');
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log('  ✓ Direct Dashboard API Request Blocked (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }

  try {
    await axios.post(
      `${API_BASE}/vendor/products`,
      {
        name: 'Unauthorized Product',
        price: 999,
        stock: 10,
        category: 'electronics',
      },
      { headers: { Authorization: `Bearer ${tempToken}` } }
    );
    throw new Error('❌ Step 7 Failed: Pending seller uploaded product!');
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log('  ✓ Direct Product Upload API Blocked (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }

  // ===================================================================
  // STEP 4: Admin Clicks Accept
  // ===================================================================
  console.log('\n▶ STEP 4: Admin clicks Accept (Approve & Activate Seller)...');
  const approveRes = await axios.put(
    `${API_BASE}/admin/vendors/${sellerId}/status`,
    { status: 'approved' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  console.log('  Admin API Response:', approveRes.data.message);
  console.log('  New Status in DB:', approveRes.data.vendor.vendorStatus);

  if (approveRes.data.vendor.vendorStatus !== 'approved') {
    throw new Error('❌ Step 4 Failed: Vendor status not set to approved');
  }
  console.log('  ✓ Verified: Application status changed to "approved" in database.\n');

  // ===================================================================
  // STEP 5: Approved Seller Can Now Log In & Use Dashboard
  // ===================================================================
  console.log('▶ STEP 5: Verifying approved seller can now log in and add products...');
  const sellerLoginRes = await axios.post(`${API_BASE}/vendor/login`, {
    email: sellerEmail,
    password: sellerPassword,
  });

  console.log('  Status Code:', sellerLoginRes.status);
  console.log('  Login Token Received:', !!sellerLoginRes.data.token);
  console.log('  Logged In Role:', sellerLoginRes.data.user.role);
  console.log('  Vendor Status:', sellerLoginRes.data.user.vendorStatus);

  const sellerToken = sellerLoginRes.data.token;
  if (!sellerToken || sellerLoginRes.data.user.vendorStatus !== 'approved') {
    throw new Error('❌ Step 5 Failed: Seller login failed after approval');
  }

  // Verify dashboard access
  const dashRes = await axios.get(`${API_BASE}/vendor/dashboard`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  console.log('  ✓ Dashboard API Access Granted! Status:', dashRes.data.success);

  // Verify product publishing permissions
  const catRes = await axios.get(`${API_BASE}/categories`);
  const catId = catRes.data.categories?.[0]?._id;
  const productRes = await axios.post(
    `${API_BASE}/vendor/products`,
    {
      name: `Zenith Smart ANC Headphones ${randomSuffix}`,
      description: 'Active Noise Cancelling high-fidelity audiophile wireless headphones',
      price: 4999,
      originalPrice: 7999,
      stock: 25,
      category: catId,
      brand: 'Zenith',
      sku: `ZEN-${randomSuffix}`,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    },
    { headers: { Authorization: `Bearer ${sellerToken}` } }
  );
  console.log('  ✓ Product Upload Succeeded! Product ID:', productRes.data.product?._id);

  // ===================================================================
  // STEP 6: Testing Rejection Workflow
  // ===================================================================
  console.log('\n▶ STEP 6: Testing Admin Reject workflow...');
  const rejectedSellerEmail = `rejected_seller_${randomSuffix}@marketplace.com`;
  const regRejectRes = await axios.post(`${API_BASE}/vendor/register`, {
    name: 'Rejected Applicant',
    email: rejectedSellerEmail,
    password: 'Password@123',
    phone: '9876500099',
    storeName: `Dubious Store ${randomSuffix}`,
    taxId: 'INVALID_TAX_ID',
  });
  const rejectSellerId = regRejectRes.data.user._id || regRejectRes.data.user.id;

  const rejectionReason = 'GSTIN certificate is invalid and address could not be verified.';
  const rejectRes = await axios.put(
    `${API_BASE}/admin/vendors/${rejectSellerId}/status`,
    { status: 'rejected', rejectionReason },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  console.log('  Admin Rejected Vendor:', rejectRes.data.message);
  console.log('  Rejection Reason saved in DB:', rejectRes.data.vendor.vendorRejectionReason);

  // Verify rejected seller cannot login
  try {
    await axios.post(`${API_BASE}/vendor/login`, {
      email: rejectedSellerEmail,
      password: 'Password@123',
    });
    throw new Error('❌ Step 6 Failed: Rejected seller was able to log in!');
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log('  ✓ Rejected Seller Blocked on Login (HTTP 403):', err.response.data.message);
      if (!err.response.data.message.includes(rejectionReason)) {
        throw new Error('❌ Step 6 Failed: Rejection reason not shown to seller');
      }
      console.log('  ✓ Verified: Rejection reason is accurately shown to applicant.');
    } else {
      throw err;
    }
  }

  // ===================================================================
  // STEP 8: Customer Registration & Login Work Independently
  // ===================================================================
  console.log('\n▶ STEP 8: Verifying customer registration & login work independently...');
  const customerEmail = `shopper_${randomSuffix}@gmail.com`;
  const custRegRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'Pooja Verma',
    email: customerEmail,
    password: 'CustomerPassword@123',
    phone: '9812345678',
  });

  console.log('  Customer Registered: Status:', custRegRes.status);
  console.log('  Customer Token Received:', !!custRegRes.data.token);
  console.log('  Customer Role:', custRegRes.data.user.role);

  if (!custRegRes.data.token || custRegRes.data.user.role !== 'user') {
    throw new Error('❌ Step 8 Failed: Customer registration did not complete independently');
  }

  const custLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: customerEmail,
    password: 'CustomerPassword@123',
  });
  console.log('  Customer Logged In: Status:', custLoginRes.status, 'Token:', !!custLoginRes.data.token);
  console.log('  ✓ Verified: Customer registration and login work completely independently from seller approval.\n');

  console.log('========================================================================');
  console.log('🎉 ALL 8 WORKFLOW REQUIREMENTS SUCCESSFULLY VERIFIED & 100% OPERATIONAL!');
  console.log('========================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err.response?.data || err.message);
  process.exit(1);
});
