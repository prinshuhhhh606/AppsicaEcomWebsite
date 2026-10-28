require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const connectDB = require('./config/db');
const seedData = require('./seed');
const app = require('./app');

let axios;
try {
  axios = require('axios');
} catch {
  axios = require('../../EcomAppsica/node_modules/axios');
}

const PORT = 5002; // Use isolated port for test runner
const API_BASE = `http://localhost:${PORT}/api`;

async function main() {
  console.log('Connecting to database and starting test server on port', PORT, '...');
  await connectDB();
  await seedData();

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}\n`);

    try {
      console.log('========================================================================');
      console.log('🧪 TESTING: DELIVERY PARTNER REGISTRATION & ADMIN APPROVAL WORKFLOW');
      console.log('========================================================================\n');

      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const deliveryEmail = `test_rider_${randomSuffix}@delivery.com`;
      const deliveryPassword = 'Password@123';
      const deliveryPhone = `98765${randomSuffix.toString().slice(0, 5)}`;
      const vehicleNumber = `MH-02-AB-${randomSuffix.toString().slice(0, 4)}`;
      const drivingLicense = `DL-MH2024${randomSuffix}`;

      // ===================================================================
      // STEP 1: Delivery Partner Registration
      // ===================================================================
      console.log('▶ STEP 1: Delivery Partner submits registration form...');
      const regPayload = {
        name: `Vikram Singh ${randomSuffix}`,
        email: deliveryEmail,
        password: deliveryPassword,
        phone: deliveryPhone,
        vehicleType: 'bike',
        vehicleNumber,
        drivingLicenseNumber: drivingLicense,
        emergencyContact: '9876543210',
        deliveryCity: 'Mumbai',
      };

      const regRes = await axios.post(`${API_BASE}/delivery/register`, regPayload);
      console.log('  Status Code:', regRes.status);
      console.log('  Message:', regRes.data.message);
      console.log('  Delivery Status in DB:', regRes.data.deliveryStatus);

      if (
        regRes.status !== 201 ||
        regRes.data.deliveryStatus !== 'pending' ||
        regRes.data.message !== 'Your registration request has been submitted successfully. Please wait for admin approval.'
      ) {
        throw new Error('❌ Step 1 Failed: Delivery partner registration did not return expected message or status');
      }
      if (regRes.data.token) {
        throw new Error('❌ Step 1 Failed: Token was issued before admin approval!');
      }
      console.log('  ✓ Verified: Status is "pending", no immediate token granted, exact required message received.\n');

      const partnerId = regRes.data.user._id || regRes.data.user.id;

      // ===================================================================
      // STEP 2: Request Appears in Admin Panel
      // ===================================================================
      console.log('▶ STEP 2: Verifying request appears in Admin Panel under Delivery Partner Approval Requests...');
      const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@appsica.com',
        password: 'admin123',
      });
      const adminToken = adminLogin.data.token;

      const adminPartnersRes = await axios.get(`${API_BASE}/admin/delivery-partners`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const foundPartner = (adminPartnersRes.data.partners || []).find(
        (p) => p.email === deliveryEmail.toLowerCase()
      );

      if (!foundPartner) {
        throw new Error('❌ Step 2 Failed: Newly registered delivery partner not found in admin delivery list');
      }
      if (foundPartner.deliveryStatus !== 'pending') {
        throw new Error(`❌ Step 2 Failed: Expected deliveryStatus "pending" in admin list, got "${foundPartner.deliveryStatus}"`);
      }
      console.log(`  ✓ Verified: Partner "${foundPartner.name}" found in Admin Panel with status "pending".\n`);

      // ===================================================================
      // STEP 3: Login Attempt while Pending (Must be Blocked)
      // ===================================================================
      console.log('▶ STEP 3: Verifying login is BLOCKED when delivery partner status is "pending"...');
      try {
        await axios.post(`${API_BASE}/delivery/login`, {
          email: deliveryEmail,
          password: deliveryPassword,
        });
        throw new Error('❌ Step 3 Failed: Pending delivery partner was able to log in!');
      } catch (err) {
        if (err.response) {
          console.log('  HTTP Status:', err.response.status);
          console.log('  Backend Message:', err.response.data.message);
          if (
            err.response.status === 403 &&
            err.response.data.message === 'Your account has not been approved by the admin yet. Please wait for approval.'
          ) {
            console.log('  ✓ Verified: Login blocked with 403 and exact message: "Your account has not been approved by the admin yet. Please wait for approval."\n');
          } else {
            throw new Error(`❌ Step 3 Failed: Unexpected message or status: ${JSON.stringify(err.response.data)}`);
          }
        } else {
          throw err;
        }
      }

      // ===================================================================
      // STEP 4: Admin Rejection Workflow
      // ===================================================================
      console.log('▶ STEP 4: Admin REJECTS the delivery partner application...');
      const rejectRes = await axios.put(
        `${API_BASE}/admin/delivery-partners/${partnerId}/status`,
        {
          status: 'rejected',
          rejectionReason: 'Vehicle documentation or license verification criteria not fulfilled.',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      console.log('  Admin Update Message:', rejectRes.data.message);
      console.log('  Updated Status in DB:', rejectRes.data.partner.deliveryStatus);

      if (rejectRes.data.partner.deliveryStatus !== 'rejected') {
        throw new Error('❌ Step 4 Failed: Partner status in DB was not updated to "rejected"');
      }
      console.log('  ✓ Verified: Status updated to "rejected" in database.\n');

      // ===================================================================
      // STEP 5: Login Attempt while Rejected (Must be Blocked)
      // ===================================================================
      console.log('▶ STEP 5: Verifying login is BLOCKED when delivery partner status is "rejected"...');
      try {
        await axios.post(`${API_BASE}/delivery/login`, {
          email: deliveryEmail,
          password: deliveryPassword,
        });
        throw new Error('❌ Step 5 Failed: Rejected delivery partner was able to log in!');
      } catch (err) {
        if (err.response) {
          console.log('  HTTP Status:', err.response.status);
          console.log('  Backend Message:', err.response.data.message);
          if (
            err.response.status === 403 &&
            err.response.data.message === 'Your registration request has been rejected. Please contact the admin for more information.'
          ) {
            console.log('  ✓ Verified: Login blocked with 403 and exact message: "Your registration request has been rejected. Please contact the admin for more information."\n');
          } else {
            throw new Error(`❌ Step 5 Failed: Unexpected message or status: ${JSON.stringify(err.response.data)}`);
          }
        } else {
          throw err;
        }
      }

      // ===================================================================
      // STEP 6: Admin Approval Workflow
      // ===================================================================
      console.log('▶ STEP 6: Admin APPROVES the delivery partner application...');
      const approveRes = await axios.put(
        `${API_BASE}/admin/delivery-partners/${partnerId}/status`,
        { status: 'approved' },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      console.log('  Admin Update Message:', approveRes.data.message);
      console.log('  Updated Status in DB:', approveRes.data.partner.deliveryStatus);
      console.log('  Role in DB:', approveRes.data.partner.role);

      if (approveRes.data.partner.deliveryStatus !== 'approved' || approveRes.data.partner.role !== 'delivery') {
        throw new Error('❌ Step 6 Failed: Partner status in DB was not updated to "approved" with role "delivery"');
      }
      console.log('  ✓ Verified: Partner status updated to "approved" and role strictly set to "delivery" in database.\n');

      // ===================================================================
      // STEP 7: Login Attempt after Approval (Must SUCCEED)
      // ===================================================================
      console.log('▶ STEP 7: Verifying login SUCCEEDS after Admin approval...');
      const loginRes = await axios.post(`${API_BASE}/delivery/login`, {
        email: deliveryEmail,
        password: deliveryPassword,
      });

      console.log('  HTTP Status:', loginRes.status);
      console.log('  Login Message:', loginRes.data.message);
      console.log('  Session Token Issued:', Boolean(loginRes.data.token));
      console.log('  Partner Role in Session:', loginRes.data.user.role);
      console.log('  Partner Delivery Status in Session:', loginRes.data.user.deliveryStatus);

      if (!loginRes.data.token || loginRes.data.user.deliveryStatus !== 'approved') {
        throw new Error('❌ Step 7 Failed: Login did not issue token or status was not approved');
      }
      console.log('  ✓ Verified: Token generated, role is delivery, deliveryStatus is approved.\n');

      const deliveryToken = loginRes.data.token;

      // ===================================================================
      // STEP 8: Protected Delivery Dashboard Access
      // ===================================================================
      console.log('▶ STEP 8: Verifying access to protected Delivery Dashboard APIs...');
      const dashRes = await axios.get(`${API_BASE}/delivery/dashboard`, {
        headers: { Authorization: `Bearer ${deliveryToken}` },
      });

      console.log('  Dashboard Access Status:', dashRes.status);
      console.log('  Stats Available:', Boolean(dashRes.data.stats));

      if (dashRes.status !== 200 || !dashRes.data.success) {
        throw new Error('❌ Step 8 Failed: Could not access delivery dashboard with approved token');
      }
      console.log('  ✓ Verified: Approved delivery partner can access live dashboard and operations!\n');

      console.log('========================================================================');
      console.log('🎉 ALL 8 TESTS PASSED: COMPLETE DELIVERY APPROVAL WORKFLOW VERIFIED!');
      console.log('========================================================================\n');

      server.close(() => {
        process.exit(0);
      });
    } catch (err) {
      console.error('\n❌ TEST RUN FAILED:', err.message);
      if (err.response?.data) {
        console.error('Response details:', err.response.data);
      }
      server.close(() => {
        process.exit(1);
      });
    }
  });
}

main().catch((err) => {
  console.error('Fatal initialization error:', err.message);
  process.exit(1);
});

