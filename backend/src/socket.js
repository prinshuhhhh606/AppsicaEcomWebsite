const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // Client can join a specific role room (e.g. 'sellers', 'riders')
    socket.on('join_room', (room) => {
      if (room && typeof room === 'string') {
        socket.join(room);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

/**
 * Get current active Socket.IO server instance
 */
const getIO = () => {
  return io;
};

/**
 * Broadcast event when a delivery partner is verified/approved by Admin
 */
const emitDriverApproved = (driverData) => {
  if (!io) return;
  io.emit('driver:approved', driverData);
  io.emit('delivery-partners:updated');
};

/**
 * Broadcast event when a delivery partner is suspended, rejected, or deactivated
 */
const emitDriverRemoved = (driverId, reason = '') => {
  if (!io) return;
  io.emit('driver:removed', { driverId: String(driverId), reason });
  io.emit('delivery-partners:updated');
};

/**
 * Broadcast event when a delivery partner toggles their online/offline availability
 */
const emitDriverAvailabilityChanged = (driverId, isOnline) => {
  if (!io) return;
  io.emit('driver:availability_changed', { driverId: String(driverId), isOnline: Boolean(isOnline) });
};

/**
 * Broadcast event when a driver's active orders workload changes
 */
const emitDriverWorkloadUpdated = (driverId, activeOrdersCount) => {
  if (!io) return;
  io.emit('driver:workload_updated', { driverId: String(driverId), activeOrdersCount: Number(activeOrdersCount) });
};

module.exports = {
  initSocket,
  getIO,
  emitDriverApproved,
  emitDriverRemoved,
  emitDriverAvailabilityChanged,
  emitDriverWorkloadUpdated,
};

