import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../utils/constants';

let socket = null;

const getSocketBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
  if (!envUrl || envUrl === '/api') {
    // In dev / Vite proxy mode, default to window.location.origin
    return undefined;
  }
  // Strip trailing /api or slashes if present
  return envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

export const getSocket = () => {
  if (!socket) {
    const url = getSocketBaseUrl();
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
    });

    socket.on('connect', () => {
      // Join sellers room
      socket.emit('join_room', 'sellers');
    });

    socket.on('disconnect', () => {});

    socket.on('connect_error', () => {});
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

