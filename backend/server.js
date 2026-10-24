require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedData = require('./src/seed');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    await seedData();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`AppsicaEcom Backend running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
