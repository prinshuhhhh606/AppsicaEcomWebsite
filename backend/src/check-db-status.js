const mongoose = require('mongoose');
require('dotenv').config();

const checkDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/appsicaecom';
    const conn = await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connection Status: ACTIVE & CONNECTED');
    console.log('🌐 Host:          ', conn.connection.host);
    console.log('📁 Database Name: ', conn.connection.name);
    console.log('🔌 Port:          ', conn.connection.port);

    const collections = await conn.connection.db.listCollections().toArray();
    console.log('\n📊 Live Collections & Document Counts in MongoDB:');
    for (const col of collections) {
      const count = await conn.connection.db.collection(col.name).countDocuments();
      console.log('  • ' + col.name.padEnd(24) + ': ' + count + ' records');
    }

    // Check latest order created dynamically
    const Order = conn.connection.db.collection('orders');
    const latestOrder = await Order.findOne({}, { sort: { createdAt: -1 } });
    if (latestOrder) {
      console.log('\n📦 Latest Dynamic Order in MongoDB:');
      console.log('   Order ID:        ', latestOrder.orderId);
      console.log('   Total Amount:    ', '₹' + latestOrder.total);
      console.log('   Payment Status:  ', latestOrder.paymentStatus);
      console.log('   Order Status:    ', latestOrder.orderStatus);
      console.log('   Delivery Status: ', latestOrder.deliveryStatus);
      console.log('   Delivery OTP:    ', latestOrder.deliveryOtp);
      console.log('   Created At:      ', latestOrder.createdAt);
    }

    // Check Users count
    const User = conn.connection.db.collection('users');
    const users = await User.find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
    console.log('\n👥 Dynamic Users in MongoDB (' + users.length + ' total):');
    users.slice(0, 6).forEach((u) => {
      console.log('   - ' + u.name.padEnd(18) + ' (' + u.email.padEnd(25) + ') -> Role: ' + u.role);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

checkDB();
