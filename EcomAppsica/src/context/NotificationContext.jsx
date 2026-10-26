import React, { useState, useCallback } from 'react';
import { NotificationContext } from './NotificationContextValue';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), duration);
    return id;
  }, [removeNotification]);

  const toast = {
    success: (msg, dur) => addNotification(msg, 'success', dur),
    error: (msg, dur) => addNotification(msg, 'error', dur),
    info: (msg, dur) => addNotification(msg, 'info', dur),
    warning: (msg, dur) => addNotification(msg, 'warning', dur),
  };

  return (
    <NotificationContext.Provider value={{ notifications, toast, removeNotification }}>
      {children}
      <ToastContainer notifications={notifications} onClose={removeNotification} />
    </NotificationContext.Provider>
  );
};

const ToastContainer = ({ notifications, onClose }) => {
  if (!notifications.length) return null;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notifications.map(n => (
        <div key={n.id} style={{
          background: n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#3b82f6',
          color: '#fff', padding: '12px 20px', borderRadius: 10, minWidth: 280, maxWidth: 380,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'slideDown 0.3s both',
          fontSize: '0.9rem', fontWeight: 500
        }}>
          <span>{n.message}</span>
          <button onClick={() => onClose(n.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
};
