require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedData = require('./src/seed');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize real-time Socket.IO on the HTTP server
initSocket(server);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    await seedData();

    const HOST = process.env.HOST || '0.0.0.0';

    server.listen(PORT, HOST, () => {
      console.log(`===============================================`);
      console.log(`AppsicaEcom Backend running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`WebSocket:   Socket.IO server active on port ${PORT}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
