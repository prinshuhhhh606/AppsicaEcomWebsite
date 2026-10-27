const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Windows & certain ISPs (Airtel/Jio etc.) fail SRV resolution with querySrv ECONNREFUSED.
    // Setting public DNS (8.8.8.8, 1.1.1.1) fixes SRV lookup for MongoDB Atlas.
    if (mongoUri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('⚠️ Could not set custom DNS servers:', dnsErr.message);
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

