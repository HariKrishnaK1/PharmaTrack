import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { alertService } from '../services/alertService';
import { useAuth } from './AuthContext';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await alertService.getAlerts({ limit: 10, isResolved: 'false' });
      setAlerts(res.data || []);
      setUnreadCount(res.unreadCount || 0);
      setCriticalCount(res.criticalCount || 0);
    } catch (err) {
      console.warn('Failed to fetch alerts:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // 1-minute background refresh
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markRead = async (id) => {
    try {
      await alertService.markRead(id);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const resolveAlert = async (id, note) => {
    try {
      await alertService.resolveAlert(id, note);
      setAlerts(prev => prev.filter(a => a._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      fetchAlerts();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <AlertContext.Provider value={{
      alerts,
      unreadCount,
      criticalCount,
      loading,
      refreshAlerts: fetchAlerts,
      markRead,
      resolveAlert
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlerts must be used within an AlertProvider');
  return context;
};