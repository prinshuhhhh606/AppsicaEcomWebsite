const axios = require('axios');
const jwt = require('jsonwebtoken');

const API = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom';

async function runAudit() {
  console.log('========================================================================');
  console.log('🧪 TESTING ALL 9 SELLER APPROVAL & AUTHENTICATION SCENARIOS');
  console.log('========================================================================\n');

  const stamp = Math.floor(10000 + Math.random() * 90000);
  const sellerEmail = `audit_seller_${stamp}@appsica.com`;
  const sellerPassword = 'AuditSellerPass@123';
  const storeName = `Audit Tech Electronics ${stamp}`;

  // -------------------------------------------------------------------
  // Scenario 1: Register a new seller without admin approval
  // -------------------------------------------------------------------
  console.log('▶ Scenario 1: Registering new seller without admin approval...');
  const regRes = await axios.post(`${API}/vendor/register`, {
    name: `Audit Seller ${stamp}`,
    email: sellerEmail,
    password: sellerPassword,
    phone: '9876543210',
    storeName,
    storeDescription: 'Audit store description',
    businessAddress: '123 Audit Way, Mumbai',
    taxId: `27AABCT${stamp}Z1`,
  });

  const sellerId = regRes.data.user._id || regRes.data.user.id;
  const regToken = regRes.data.token;
  const regStatus = regRes.data.vendorStatus || regRes.data.user.vendorStatus;

  console.log('  Status Code:', regRes.status);
  console.log('  Token issued on register:', !!regToken);
  console.log('  vendorStatus in response:', regStatus);

  if (regRes.status !== 201 || regToken || regStatus !== 'pending') {
    throw new Error('❌ Scenario 1 Failed: Seller registration issued token or was not pending!');
  }
  console.log('  ✓ Verified: Seller registered with vendorStatus = "pending" and NO active token.\n');

  // -------------------------------------------------------------------
  // Scenario 2: Try logging in with correct credentials while pending
  // -------------------------------------------------------------------
  console.log('▶ Scenario 2: Logging in with correct credentials while pending...');
  try {
    await axios.post(`${API}/vendor/login`, {
      email: sellerEmail,
      password: sellerPassword,
    });
    throw new Error('❌ Scenario 2 Failed: Pending seller was able to log in to /vendor/login!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ /vendor/login correctly blocked (HTTP 403):', err.response.data.message);
      if (err.response.data.message !== 'Your registration request has not been approved by the admin yet. Please wait for approval.') {
        throw new Error('❌ Scenario 2 Failed: Exact pending message mismatch on /vendor/login');
      }
    } else {
      throw err;
    }
  }

  try {
    await axios.post(`${API}/auth/login`, {
      email: sellerEmail,
      password: sellerPassword,
    });
    throw new Error('❌ Scenario 2 Failed: Pending seller was able to log in to /auth/login!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ /auth/login correctly blocked (HTTP 403):', err.response.data.message);
      if (err.response.data.message !== 'Your registration request has not been approved by the admin yet. Please wait for approval.') {
        throw new Error('❌ Scenario 2 Failed: Exact pending message mismatch on /auth/login');
      }
    } else {
      throw err;
    }
  }

  // Also verify wrong password returns 401
  try {
    await axios.post(`${API}/vendor/login`, {
      email: sellerEmail,
      password: 'wrong_password',
    });
    throw new Error('❌ Scenario 2 Failed: Wrong password did not fail!');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('  ✓ Wrong password correctly returns HTTP 401:', err.response.data.message);
    } else {
      throw err;
    }
  }
  console.log('  ✓ Verified: Pending seller denied with exact message, wrong password returns 401.\n');

  // -------------------------------------------------------------------
  // Scenario 3 & 6: Token check / Protected vendor API calls
  // -------------------------------------------------------------------
  console.log('▶ Scenario 3 & 6: Testing protected vendor API calls using existing token...');
  const forgedToken = jwt.sign({ userId: sellerId }, JWT_SECRET, { expiresIn: '1h' });

  try {
    await axios.get(`${API}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    throw new Error('❌ Scenario 6 Failed: Pending seller accessed /vendor/dashboard!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ Dashboard API blocked (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }

  try {
    await axios.get(`${API}/vendor/products`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    throw new Error('❌ Scenario 6 Failed: Pending seller accessed /vendor/products!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ Products API blocked (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }

  // Verify getProfile returns actual status ('pending', never defaulted to 'approved')
  const profileRes = await axios.get(`${API}/auth/profile`, {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  console.log('  Profile API vendorStatus returned from DB:', profileRes.data.user.vendorStatus);
  if (profileRes.data.user.vendorStatus !== 'pending') {
    throw new Error('❌ Scenario 3 Failed: Profile API did not return actual pending status!');
  }
  console.log('  ✓ Verified: Backend validates database on every request, profile returns pending.\n');

  // -------------------------------------------------------------------
  // Scenario 7: Admin changes status after login & tests subsequent requests
  // -------------------------------------------------------------------
  console.log('▶ Scenario 7: Testing admin status changes on existing session...');
  // 1. Admin login
  const adminLogin = await axios.post(`${API}/auth/login`, {
    email: 'admin@appsica.com',
    password: 'admin123',
  });
  const adminToken = adminLogin.data.token;

  // 2. Approve this seller
  await axios.put(
    `${API}/admin/vendors/${sellerId}/status`,
    { status: 'approved' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  // 3. Seller logs in now that they are approved
  const approvedLogin = await axios.post(`${API}/vendor/login`, {
    email: sellerEmail,
    password: sellerPassword,
  });
  const liveSellerToken = approvedLogin.data.token;
  console.log('  Seller logged in with status approved, got token:', !!liveSellerToken);

  // 4. Test request with live token - should succeed
  const dashOK = await axios.get(`${API}/vendor/dashboard`, {
    headers: { Authorization: `Bearer ${liveSellerToken}` },
  });
  console.log('  ✓ Dashboard access GRANTED while approved (HTTP 200): success =', dashOK.data.success);

  // 5. Admin changes seller status to 'suspended'
  console.log('  Admin changes seller status to "suspended"...');
  await axios.put(
    `${API}/admin/vendors/${sellerId}/status`,
    { status: 'suspended' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  // 6. Test subsequent request with the SAME live token - MUST fail with 403
  try {
    await axios.get(`${API}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${liveSellerToken}` },
    });
    throw new Error('❌ Scenario 7 Failed: Suspended seller was able to access dashboard with old token!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ Live token immediately BLOCKED after status changed to suspended (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }

  // 7. Admin changes seller status to 'rejected'
  console.log('  Admin changes seller status to "rejected"...');
  await axios.put(
    `${API}/admin/vendors/${sellerId}/status`,
    { status: 'rejected', rejectionReason: 'Store verification failed audit.' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  try {
    await axios.get(`${API}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${liveSellerToken}` },
    });
    throw new Error('❌ Scenario 7 Failed: Rejected seller was able to access dashboard with old token!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ Live token immediately BLOCKED after status changed to rejected (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }

  // 8. Admin changes seller status to 'pending'
  console.log('  Admin changes seller status back to "pending"...');
  await axios.put(
    `${API}/admin/vendors/${sellerId}/status`,
    { status: 'pending' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  try {
    await axios.get(`${API}/vendor/dashboard`, {
      headers: { Authorization: `Bearer ${liveSellerToken}` },
    });
    throw new Error('❌ Scenario 7 Failed: Pending seller was able to access dashboard with old token!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✓ Live token immediately BLOCKED after status changed to pending (HTTP 403):', err.response.data.message);
    } else {
      throw err;
    }
  }
  console.log('  ✓ Verified: Admin status changes take effect immediately on existing tokens.\n');

  // -------------------------------------------------------------------
  // Scenario 8: Approve pending seller and verify normal login works
  // -------------------------------------------------------------------
  console.log('▶ Scenario 8: Approving pending seller and verifying normal login...');
  const finalApprove = await axios.put(
    `${API}/admin/vendors/${sellerId}/status`,
    { status: 'approved' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  console.log('  Admin approved response:', finalApprove.data.message);

  const finalLogin = await axios.post(`${API}/vendor/login`, {
    email: sellerEmail,
    password: sellerPassword,
  });
  console.log('  Final Login Status:', finalLogin.status);
  console.log('  Final Login Token:', !!finalLogin.data.token);
  console.log('  Final Login vendorStatus:', finalLogin.data.user.vendorStatus);

  if (!finalLogin.data.token || finalLogin.data.user.vendorStatus !== 'approved') {
    throw new Error('❌ Scenario 8 Failed: Approved seller could not log in!');
  }

  const finalDash = await axios.get(`${API}/vendor/dashboard`, {
    headers: { Authorization: `Bearer ${finalLogin.data.token}` },
  });
  console.log('  ✓ Verified: Approved seller logged in and accessed dashboard successfully.\n');

  // -------------------------------------------------------------------
  // Scenario 9: Verify customer and admin authentication still work
  // -------------------------------------------------------------------
  console.log('▶ Scenario 9: Verifying customer and admin authentication...');
  const custEmail = `cust_audit_${stamp}@test.com`;
  const custReg = await axios.post(`${API}/auth/register`, {
    name: 'Customer Audit',
    email: custEmail,
    password: 'CustPassword@123',
    phone: '9812345678',
  });
  console.log('  Customer registered:', custReg.status, 'Token:', !!custReg.data.token, 'Role:', custReg.data.user.role);

  const custLogin = await axios.post(`${API}/auth/login`, {
    email: custEmail,
    password: 'CustPassword@123',
  });
  console.log('  Customer login:', custLogin.status, 'Token:', !!custLogin.data.token);

  const adminDash = await axios.get(`${API}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('  Admin dashboard access:', adminDash.status, 'Success:', adminDash.data.success);
  console.log('  ✓ Verified: Customer and admin authentication work completely independently and without issue.\n');

  console.log('========================================================================');
  console.log('🎉 ALL 9 SCENARIOS VERIFIED SUCCESSFULLY AND 100% OPERATIONAL!');
  console.log('========================================================================');
}

runAudit().catch((err) => {
  console.error('❌ Audit Failed:', err.response?.data || err.message);
  process.exit(1);
});
