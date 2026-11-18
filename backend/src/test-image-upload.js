const path = require('path');
const fs = require('fs');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');
const User = require('./models/user');

async function runUploadTests() {
  console.log('========================================================');
  console.log('🧪 Starting Image Upload Integration Tests');
  console.log('========================================================\n');

  // Stub User.findById to allow testing without live MongoDB connection
  const mockAdminUser = {
    _id: '507f191e810c19729de860ea',
    name: 'Admin Tester',
    email: 'admin@appsica.com',
    role: 'admin',
    isBlocked: false,
  };

  User.findById = () => ({
    select: async () => mockAdminUser,
  });

  const token = jwt.sign(
    { userId: mockAdminUser._id, role: mockAdminUser.role },
    process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom',
    { expiresIn: '1h' }
  );

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Test HTTP server running at ${baseUrl}`);

  try {
    // 1. Create a dummy PNG buffer (1x1 pixel)
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001737501180000000049454e44ae426082',
      'hex'
    );

    // 2. Test Single Image Upload
    console.log('\n--- 1. Testing POST /api/upload/single ---');
    const boundary = '----TestBoundary' + Date.now();
    const singleBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="sample-test.png"\r\nContent-Type: image/png\r\n\r\n`
      ),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const singleRes = await fetch(`${baseUrl}/api/upload/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: singleBody,
    });

    const singleJson = await singleRes.json();
    console.log('Single upload response status:', singleRes.status);
    console.log('Response body:', singleJson);

    if (singleRes.status !== 200 || !singleJson.url) {
      throw new Error(`Single upload failed: ${JSON.stringify(singleJson)}`);
    }
    console.log('✓ Single image uploaded successfully! URL:', singleJson.url);

    // 3. Test Static File Serving
    console.log('\n--- 2. Testing Static File Serving (/uploads/:file) ---');
    const uploadedFilename = singleJson.filename;
    const staticRes = await fetch(`${baseUrl}/uploads/${uploadedFilename}`);
    console.log('Static fetch status:', staticRes.status);
    console.log('Content-Type:', staticRes.headers.get('content-type'));
    if (staticRes.status !== 200) {
      throw new Error(`Failed to fetch uploaded static file from /uploads/${uploadedFilename}`);
    }
    console.log('✓ Uploaded image correctly served statically with HTTP 200!');

    // 4. Test Multiple Images Upload
    console.log('\n--- 3. Testing POST /api/upload/multiple ---');
    const multiBoundary = '----MultiBoundary' + Date.now();
    const multiBody = Buffer.concat([
      Buffer.from(
        `--${multiBoundary}\r\nContent-Disposition: form-data; name="images"; filename="pic1.png"\r\nContent-Type: image/png\r\n\r\n`
      ),
      pngBuffer,
      Buffer.from(
        `\r\n--${multiBoundary}\r\nContent-Disposition: form-data; name="images"; filename="pic2.png"\r\nContent-Type: image/png\r\n\r\n`
      ),
      pngBuffer,
      Buffer.from(`\r\n--${multiBoundary}--\r\n`),
    ]);

    const multiRes = await fetch(`${baseUrl}/api/upload/multiple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${multiBoundary}`,
      },
      body: multiBody,
    });

    const multiJson = await multiRes.json();
    console.log('Multiple upload response status:', multiRes.status);
    console.log('Response body:', multiJson);

    if (multiRes.status !== 200 || !multiJson.urls || multiJson.urls.length !== 2) {
      throw new Error(`Multiple upload failed: ${JSON.stringify(multiJson)}`);
    }
    console.log('✓ Multiple images uploaded successfully! URLs count:', multiJson.urls.length);

    // 5. Test Invalid File Format Rejection (e.g. .txt)
    console.log('\n--- 4. Testing Unsupported File Format Rejection (.txt) ---');
    const badBoundary = '----BadBoundary' + Date.now();
    const badBody = Buffer.concat([
      Buffer.from(
        `--${badBoundary}\r\nContent-Disposition: form-data; name="image"; filename="document.txt"\r\nContent-Type: text/plain\r\n\r\n`
      ),
      Buffer.from('This is a text file, not an image!'),
      Buffer.from(`\r\n--${badBoundary}--\r\n`),
    ]);

    const badRes = await fetch(`${baseUrl}/api/upload/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${badBoundary}`,
      },
      body: badBody,
    });

    const badJson = await badRes.json();
    console.log('Bad file upload status:', badRes.status);
    console.log('Bad file error message:', badJson.message);
    if (badRes.status !== 400 || !badJson.message.includes('Only JPG, JPEG, PNG, and WEBP')) {
      throw new Error(`Invalid format was not properly rejected: ${JSON.stringify(badJson)}`);
    }
    console.log('✓ Invalid file format correctly blocked with HTTP 400!');

    // 6. Test File Size Limit Rejection (> 10MB)
    console.log('\n--- 5. Testing File Size Limit Rejection (> 10MB) ---');
    const bigBoundary = '----BigBoundary' + Date.now();
    // 10.5 MB fake buffer
    const bigBuffer = Buffer.alloc(10.5 * 1024 * 1024, 0);
    const bigBody = Buffer.concat([
      Buffer.from(
        `--${bigBoundary}\r\nContent-Disposition: form-data; name="image"; filename="large-image.png"\r\nContent-Type: image/png\r\n\r\n`
      ),
      bigBuffer,
      Buffer.from(`\r\n--${bigBoundary}--\r\n`),
    ]);

    const bigRes = await fetch(`${baseUrl}/api/upload/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${bigBoundary}`,
      },
      body: bigBody,
    });

    const bigJson = await bigRes.json();
    console.log('Large file upload status:', bigRes.status);
    console.log('Large file error message:', bigJson.message);
    if (bigRes.status !== 400 || !bigJson.message.includes('10MB')) {
      throw new Error(`File exceeding 10MB limit was not properly rejected: ${JSON.stringify(bigJson)}`);
    }
    console.log('✓ Oversized file (>10MB) correctly blocked with HTTP 400!');

    // 7. Verify resulting URLs
    console.log('\n--- 6. Verifying resulting URL formats and security ---');
    const allUrls = [singleJson.url, ...multiJson.urls];
    for (const u of allUrls) {
      if (u.startsWith('data:image')) {
        throw new Error('Base64 image string detected!');
      }
      if (!u.includes('/uploads/')) {
        throw new Error(`Invalid URL format: ${u}`);
      }
    }
    console.log('✓ All generated URLs are valid HTTP URLs pointing to static uploads (No Base64)!');

    console.log('\n========================================================');
    console.log('🎉 ALL 6 IMAGE UPLOAD TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Test step failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runUploadTests().then(() => {
  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}).catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
