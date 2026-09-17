import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pharmatrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pharmatrack_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          localStorage.setItem('pharmatrack_user', JSON.stringify(data.user));
        } catch (err) {
          console.warn('Session check failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pharmatrack_token', data.token);
    localStorage.setItem('pharmatrack_user', JSON.stringify(data.user));
    return data.user;
  };

  const demoLogin = async (role) => {
    let email = 'admin@pharmatrack.com';
    let password = 'Admin@123';
    if (role === 'INVENTORY_MANAGER') {
      email = 'inventory@pharmatrack.com';
      password = 'Inventory@123';
    } else if (role === 'WAREHOUSE_MANAGER') {
      email = 'warehouse@pharmatrack.com';
      password = 'Warehouse@123';
    }
    return login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pharmatrack_token');
    localStorage.removeItem('pharmatrack_user');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isInventoryManager = user?.role === 'INVENTORY_MANAGER';
  const isWarehouseManager = user?.role === 'WAREHOUSE_MANAGER';

  const canManageUsers = isAdmin;
  const canManageProducts = isAdmin || isInventoryManager;
  const canManageWarehouses = isAdmin;
  const canCreateShipments = isAdmin || isInventoryManager;
  const canUpdateStock = isAdmin || isInventoryManager || isWarehouseManager;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      demoLogin,
      logout,
      isAdmin,
      isInventoryManager,
      isWarehouseManager,
      canManageUsers,
      canManageProducts,
      canManageWarehouses,
      canCreateShipments,
      canUpdateStock
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};