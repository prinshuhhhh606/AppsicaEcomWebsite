const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const RUN_ID = Math.floor(10000 + Math.random() * 90000);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('========================================================================');
  console.log(`🚀 STARTING MULTI-ROLE AUTHENTICATION & ACCESS CONTROL TEST SUITE`);
  console.log(`   Run ID: ${RUN_ID} | Base URL: ${BASE_URL}`);
  console.log('========================================================================\n');

  // ---------------------------------------------------------
  // SCENARIO 1: CUSTOMER REGISTRATION & LOGIN
  // ---------------------------------------------------------
  console.log('--- SCENARIO 1: Customer Registration & Login ---');
  const customerEmail = `customer_${RUN_ID}@example.com`;
  const customerPassword = 'customerPassword123';

  // 1a. Register normal customer
  const custRegRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: `Customer Test ${RUN_ID}`,
    email: customerEmail,
    password: customerPassword,
    phone: '9876543210',
  });
  assert(custRegRes.status === 201, 'Customer registration returns 201 Created');
  assert(custRegRes.data.success === true, 'Customer registration returns success true');
  assert(custRegRes.data.user.role === 'user', 'Customer role defaults to "user"');
  assert(Boolean(custRegRes.data.token), 'Customer registration returns valid JWT token');

  // 1b. Exploit attempt: public registration trying to specify role: 'admin'
  const exploitEmail = `exploit_admin_${RUN_ID}@example.com`;
  const exploitRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: `Hacker Admin ${RUN_ID}`,
    email: exploitEmail,
    password: 'hackerPassword123',
    role: 'admin',
  });
  assert(exploitRes.data.user.role === 'user', 'Public registration with role: "admin" is prevented and forced to "user"');

  // 1c. Customer Login through main login endpoint
  const custLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: customerEmail,
    password: customerPassword,
  });
  assert(custLoginRes.status === 200, 'Customer login returns 200 OK');
  assert(custLoginRes.data.user.role === 'user', 'Customer authenticated role is "user"');
  const customerToken = custLoginRes.data.token;

  // 1d. Customer Profile restoration
  const custProfileRes = await axios.get(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(custProfileRes.data.user.role === 'user', 'Customer profile reflects role "user"');
  console.log('');

  // ---------------------------------------------------------
  // SCENARIO 2: ADMIN AUTHENTICATION VIA MAIN LOGIN PAGE
  // ---------------------------------------------------------
  console.log('--- SCENARIO 2: Admin Login via Main Login Page ---');
  const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@appsica.com',
    password: 'admin123',
  });
  assert(adminLoginRes.status === 200, 'Admin login via main login endpoint returns 200 OK');
  assert(adminLoginRes.data.user.role === 'admin', 'Admin authenticated role is verified by backend as "admin"');
  const adminToken = adminLoginRes.data.token;

  // 2b. Admin accesses protected admin dashboard
  const adminDashRes = await axios.get(`${BASE_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminDashRes.status === 200, 'Admin can access /api/admin/dashboard');
  assert(adminDashRes.data.success === true, 'Admin dashboard returns operational statistics');
  console.log('');

  // ---------------------------------------------------------
  // SCENARIO 3: SELLER REGISTRATION, PENDING STATUS, APPROVAL & LOGIN
  // ---------------------------------------------------------
  console.log('--- SCENARIO 3: Seller Approval Lifecycle ---');
  const sellerEmail = `seller_${RUN_ID}@appsica.com`;
  const sellerPassword = 'sellerPassword123';

  // 3a. Register seller
  const sellerRegRes = await axios.post(`${BASE_URL}/vendor/register`, {
    name: `Seller ${RUN_ID}`,
    email: sellerEmail,
    password: sellerPassword,
    storeName: `Prime Electronics ${RUN_ID}`,
    phone: '9811122233',
  });
  assert(sellerRegRes.status === 201, 'Seller registration returns 201 Created');
  assert(sellerRegRes.data.vendorStatus === 'pending', 'Seller registered with vendorStatus "pending"');
  assert(!sellerRegRes.data.token, 'Pending seller registration does NOT issue an active session token');
  const sellerId = sellerRegRes.data.user._id || sellerRegRes.data.user.id;

  // 3b. Pending seller attempts login via dedicated vendor login
  let vendorLoginBlocked = false;
  let vendorLoginMsg = '';
  try {
    await axios.post(`${BASE_URL}/vendor/login`, {
      email: sellerEmail,
      password: sellerPassword,
    });
  } catch (err) {
    vendorLoginBlocked = err.response?.status === 403;
    vendorLoginMsg = err.response?.data?.message;
  }
  assert(vendorLoginBlocked, 'Pending seller login to /api/vendor/login is rejected with HTTP 403');
  assert(
    vendorLoginMsg === 'Your registration request has not been approved by the admin yet. Please wait for approval.',
    `Pending seller receives exact approval message: "${vendorLoginMsg}"`
  );

  // 3c. Pending seller attempts login via main general login
  let mainLoginBlocked = false;
  let mainLoginMsg = '';
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: sellerEmail,
      password: sellerPassword,
    });
  } catch (err) {
    mainLoginBlocked = err.response?.status === 403;
    mainLoginMsg = err.response?.data?.message;
  }
  assert(mainLoginBlocked, 'Pending seller login to main /api/auth/login is rejected with HTTP 403');
  assert(
    mainLoginMsg === 'Your registration request has not been approved by the admin yet. Please wait for approval.',
    `Main login returns exact seller approval message: "${mainLoginMsg}"`
  );

  // 3d. Admin approves seller
  const approveVendorRes = await axios.put(
    `${BASE_URL}/admin/vendors/${sellerId}/status`,
    { status: 'approved' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  assert(approveVendorRes.status === 200, 'Admin approves seller successfully');
  assert(approveVendorRes.data.vendor.vendorStatus === 'approved', 'Vendor status updated to "approved" in DB');

  // 3e. Approved seller logs in via dedicated /api/vendor/login
  const approvedVendorLogin = await axios.post(`${BASE_URL}/vendor/login`, {
    email: sellerEmail,
    password: sellerPassword,
  });
  assert(approvedVendorLogin.status === 200, 'Approved seller login via /api/vendor/login succeeds');
  assert(approvedVendorLogin.data.user.vendorStatus === 'approved', 'Approved seller payload has vendorStatus "approved"');
  const sellerToken = approvedVendorLogin.data.token;

  // 3f. Approved seller logs in via main /api/auth/login
  const approvedMainLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: sellerEmail,
    password: sellerPassword,
  });
  assert(approvedMainLogin.status === 200, 'Approved seller login via main /api/auth/login succeeds');
  assert(approvedMainLogin.data.user.role === 'vendor', 'Authenticated role is "vendor"');
  assert(approvedMainLogin.data.user.vendorStatus === 'approved', 'Authenticated vendorStatus is "approved"');

  // 3g. Approved seller accesses protected vendor dashboard
  const vendorDashRes = await axios.get(`${BASE_URL}/vendor/dashboard`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert(vendorDashRes.status === 200, 'Approved seller can access /api/vendor/dashboard');
  console.log('');

  // ---------------------------------------------------------
  // SCENARIO 4: DELIVERY PARTNER REGISTRATION, APPROVAL & LOGIN
  // ---------------------------------------------------------
  console.log('--- SCENARIO 4: Delivery Partner Lifecycle ---');
  const deliveryEmail = `delivery_${RUN_ID}@appsica.com`;
  const deliveryPassword = 'deliveryPassword123';

  // 4a. Register delivery partner
  const delivRegRes = await axios.post(`${BASE_URL}/delivery/register`, {
    name: `Rider ${RUN_ID}`,
    email: deliveryEmail,
    password: deliveryPassword,
    phone: '9844455566',
    vehicleType: 'bike',
    vehicleNumber: 'MH-02-AB-9999',
    drivingLicenseNumber: 'DL-MH-2026-0001234',
    deliveryCity: 'Mumbai',
  });
  assert(delivRegRes.status === 201, 'Delivery partner registration returns 201 Created');
  assert(delivRegRes.data.deliveryStatus === 'pending', 'Delivery partner registered with deliveryStatus "pending"');
  assert(!delivRegRes.data.token, 'Pending delivery partner registration does NOT issue an active token');
  const deliveryId = delivRegRes.data.user._id || delivRegRes.data.user.id;

  // 4b. Pending delivery partner attempts login via dedicated /api/delivery/login
  let delivLoginBlocked = false;
  let delivLoginMsg = '';
  try {
    await axios.post(`${BASE_URL}/delivery/login`, {
      email: deliveryEmail,
      password: deliveryPassword,
    });
  } catch (err) {
    delivLoginBlocked = err.response?.status === 403;
    delivLoginMsg = err.response?.data?.message;
  }
  assert(delivLoginBlocked, 'Pending delivery partner login to /api/delivery/login is rejected with HTTP 403');
  assert(
    delivLoginMsg === 'Your registration request has not been approved by the admin yet. Please wait for approval.',
    `Pending delivery partner receives exact message: "${delivLoginMsg}"`
  );

  // 4c. Pending delivery partner attempts login via main /api/auth/login
  let mainDelivBlocked = false;
  let mainDelivMsg = '';
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: deliveryEmail,
      password: deliveryPassword,
    });
  } catch (err) {
    mainDelivBlocked = err.response?.status === 403;
    mainDelivMsg = err.response?.data?.message;
  }
  assert(mainDelivBlocked, 'Pending delivery partner login to main /api/auth/login is rejected with HTTP 403');
  assert(
    mainDelivMsg === 'Your registration request has not been approved by the admin yet. Please wait for approval.',
    `Main login returns exact delivery approval message: "${mainDelivMsg}"`
  );

  // 4d. Admin approves delivery partner
  const approveDelivRes = await axios.put(
    `${BASE_URL}/admin/delivery-partners/${deliveryId}/status`,
    { status: 'approved' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  assert(approveDelivRes.status === 200, 'Admin approves delivery partner successfully');

  // 4e. Approved delivery partner logs in via dedicated /api/delivery/login
  const approvedDelivLogin = await axios.post(`${BASE_URL}/delivery/login`, {
    email: deliveryEmail,
    password: deliveryPassword,
  });
  assert(approvedDelivLogin.status === 200, 'Approved delivery partner login via /api/delivery/login succeeds');
  assert(approvedDelivLogin.data.user.role === 'delivery', 'Authenticated role is "delivery"');
  assert(approvedDelivLogin.data.user.deliveryStatus === 'approved', 'deliveryStatus is "approved"');
  const deliveryToken = approvedDelivLogin.data.token;

  // 4f. Approved delivery partner logs in via main /api/auth/login
  const approvedMainDelivLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: deliveryEmail,
    password: deliveryPassword,
  });
  assert(approvedMainDelivLogin.status === 200, 'Approved delivery partner login via main /api/auth/login succeeds');
  assert(approvedMainDelivLogin.data.user.role === 'delivery', 'Main login authenticated role is "delivery"');
  assert(approvedMainDelivLogin.data.user.deliveryStatus === 'approved', 'Main login deliveryStatus is "approved"');

  // 4g. Approved delivery partner accesses protected delivery dashboard
  const delivDashRes = await axios.get(`${BASE_URL}/delivery/dashboard`, {
    headers: { Authorization: `Bearer ${deliveryToken}` },
  });
  assert(delivDashRes.status === 200, 'Approved delivery partner can access /api/delivery/dashboard');
  console.log('');

  // ---------------------------------------------------------
  // SCENARIO 5: INVALID CREDENTIALS & UNAUTHORIZED ROLE ACCESS
  // ---------------------------------------------------------
  console.log('--- SCENARIO 5: Invalid Credentials & Cross-Role Isolation ---');
  // 5a. Invalid password
  let badPassBlocked = false;
  let badPassMsg = '';
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: customerEmail,
      password: 'WrongPassword999!',
    });
  } catch (err) {
    badPassBlocked = err.response?.status === 401;
    badPassMsg = err.response?.data?.message;
  }
  assert(badPassBlocked, 'Invalid password returns HTTP 401 Unauthorized');
  assert(badPassMsg === 'Invalid email or password', `Error message is exact: "${badPassMsg}"`);

  // 5b. Invalid email
  let badEmailBlocked = false;
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 'nonexistent_account_xyz@test.com',
      password: 'SomePassword123',
    });
  } catch (err) {
    badEmailBlocked = err.response?.status === 401;
  }
  assert(badEmailBlocked, 'Unregistered email returns HTTP 401 Unauthorized');

  // 5c. Customer attempts to access Admin dashboard
  let custToAdminBlocked = false;
  try {
    await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
  } catch (err) {
    custToAdminBlocked = err.response?.status === 403;
  }
  assert(custToAdminBlocked, 'Customer cannot access /api/admin/dashboard (HTTP 403 Forbidden)');

  // 5d. Customer attempts to access Vendor dashboard
  let custToVendorBlocked = false;
  try {
    await axios.get(`${BASE_URL}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
  } catch (err) {
    custToVendorBlocked = err.response?.status === 403;
  }
  assert(custToVendorBlocked, 'Customer cannot access /api/vendor/dashboard (HTTP 403 Forbidden)');

  // 5e. Customer attempts to access Delivery dashboard
  let custToDelivBlocked = false;
  try {
    await axios.get(`${BASE_URL}/delivery/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
  } catch (err) {
    custToDelivBlocked = err.response?.status === 403;
  }
  assert(custToDelivBlocked, 'Customer cannot access /api/delivery/dashboard (HTTP 403 Forbidden)');

  // 5f. Delivery partner attempts to access Admin dashboard
  let delivToAdminBlocked = false;
  try {
    await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${deliveryToken}` },
    });
  } catch (err) {
    delivToAdminBlocked = err.response?.status === 403;
  }
  assert(delivToAdminBlocked, 'Delivery partner cannot access /api/admin/dashboard (HTTP 403 Forbidden)');

  // 5g. Seller attempts to access Admin dashboard
  let sellerToAdminBlocked = false;
  try {
    await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
  } catch (err) {
    sellerToAdminBlocked = err.response?.status === 403;
  }
  assert(sellerToAdminBlocked, 'Seller cannot access /api/admin/dashboard (HTTP 403 Forbidden)');
  console.log('');

  // ---------------------------------------------------------
  // SCENARIO 6: SESSION VERIFICATION & PROFILE RESTORATION
  // ---------------------------------------------------------
  console.log('--- SCENARIO 6: Session Verification & Token Authenticity ---');
  // 6a. Verify profile routes for all 4 roles
  const pCust = await axios.get(`${BASE_URL}/auth/profile`, { headers: { Authorization: `Bearer ${customerToken}` } });
  assert(pCust.data.user.role === 'user', 'Session profile for Customer verified as "user"');

  const pAdmin = await axios.get(`${BASE_URL}/auth/profile`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(pAdmin.data.user.role === 'admin', 'Session profile for Admin verified as "admin"');

  const pSeller = await axios.get(`${BASE_URL}/auth/profile`, { headers: { Authorization: `Bearer ${sellerToken}` } });
  assert(pSeller.data.user.role === 'vendor' && pSeller.data.user.vendorStatus === 'approved', 'Session profile for Seller verified as approved "vendor"');

  const pDeliv = await axios.get(`${BASE_URL}/auth/profile`, { headers: { Authorization: `Bearer ${deliveryToken}` } });
  assert(pDeliv.data.user.role === 'delivery' && pDeliv.data.user.deliveryStatus === 'approved', 'Session profile for Rider verified as approved "delivery"');

  // 6b. Tampered or expired token rejection
  let tamperedBlocked = false;
  try {
    await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: 'Bearer this_is_a_completely_fake_and_tampered_token_xyz' },
    });
  } catch (err) {
    tamperedBlocked = err.response?.status === 401;
  }
  assert(tamperedBlocked, 'Tampered token is rejected with HTTP 401 Unauthorized');

  // 6c. Missing token rejection
  let missingBlocked = false;
  try {
    await axios.get(`${BASE_URL}/auth/profile`);
  } catch (err) {
    missingBlocked = err.response?.status === 401;
  }
  assert(missingBlocked, 'Missing Authorization header is rejected with HTTP 401 Unauthorized');
  console.log('');

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log('========================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY (100% PASS RATE)`);
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('\n❌ Test suite execution failed:', err.message);
  process.exit(1);
});
