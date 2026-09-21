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
      const isDemo = localStorage.getItem('pharmatrack_is_demo') === 'true';
      if (isDemo) {
        const saved = localStorage.getItem('pharmatrack_user');
        if (saved) {
          setUser(JSON.parse(saved));
        }
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          localStorage.setItem('pharmatrack_user', JSON.stringify(data.user));
          // Store real authenticated session for quick return if simulating demo roles
          localStorage.setItem('pharmatrack_real_user', JSON.stringify(data.user));
          localStorage.setItem('pharmatrack_real_token', token);
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
    localStorage.removeItem('pharmatrack_is_demo');
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pharmatrack_token', data.token);
    localStorage.setItem('pharmatrack_user', JSON.stringify(data.user));
    // Save real authenticated session
    localStorage.setItem('pharmatrack_real_token', data.token);
    localStorage.setItem('pharmatrack_real_user', JSON.stringify(data.user));
    return data.user;
  };

  const restoreRealAccount = () => {
    const realToken = localStorage.getItem('pharmatrack_real_token');
    const realUserStr = localStorage.getItem('pharmatrack_real_user');
    if (realToken && realUserStr) {
      try {
        const realUser = JSON.parse(realUserStr);
        setUser(realUser);
        setToken(realToken);
        localStorage.removeItem('pharmatrack_is_demo');
        localStorage.setItem('pharmatrack_token', realToken);
        localStorage.setItem('pharmatrack_user', realUserStr);
        return realUser;
      } catch (err) {
        console.error('Failed to parse real user session:', err);
      }
    }
    return null;
  };

  const demoLogin = (role) => {
    // Check if the user is already authenticated with a real account matching this role
    const realUserStr = localStorage.getItem('pharmatrack_real_user');
    const realToken = localStorage.getItem('pharmatrack_real_token');
    if (realUserStr && realToken) {
      try {
        const realUser = JSON.parse(realUserStr);
        // If selecting their own real role, restore the real account instead of demo!
        if (realUser.role === role) {
          return restoreRealAccount();
        }
      } catch (err) {
        console.error(err);
      }
    }

    let name = 'demoAdmin';
    let email = 'demoadmin@pharmatrack.com';
    if (role === 'INVENTORY_MANAGER') {
      name = 'demoInventory';
      email = 'demoinventory@pharmatrack.com';
    } else if (role === 'WAREHOUSE_MANAGER') {
      name = 'demoWarehouse';
      email = 'demowarehouse@pharmatrack.com';
    }

    const demoUser = {
      _id: 'demo_' + role.toLowerCase(),
      name,
      email,
      role,
      isDemo: true,
      createdAt: new Date().toISOString()
    };

    const demoToken = 'demo_token_' + role.toLowerCase();
    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem('pharmatrack_is_demo', 'true');
    localStorage.setItem('pharmatrack_token', demoToken);
    localStorage.setItem('pharmatrack_user', JSON.stringify(demoUser));
    return demoUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pharmatrack_token');
    localStorage.removeItem('pharmatrack_user');
    localStorage.removeItem('pharmatrack_is_demo');
    localStorage.removeItem('pharmatrack_real_token');
    localStorage.removeItem('pharmatrack_real_user');
  };

  const isDemo = Boolean(user?.isDemo || localStorage.getItem('pharmatrack_is_demo') === 'true');
  const realUserStr = localStorage.getItem('pharmatrack_real_user');
  const realUser = realUserStr ? JSON.parse(realUserStr) : null;
  const hasRealAccount = Boolean(localStorage.getItem('pharmatrack_real_token') && realUser);

  const isAdmin = user?.role === 'ADMIN';
  const isInventoryManager = user?.role === 'INVENTORY_MANAGER';
  const isWarehouseManager = user?.role === 'WAREHOUSE_MANAGER';

  // Demo users have UI view permissions to open and explore creation workflows in read-only mode
  const canManageUsers = isAdmin;
  const canManageProducts = isDemo || isAdmin || isInventoryManager;
  const canManageWarehouses = isDemo || isAdmin;
  const canCreateShipments = isDemo || isAdmin || isInventoryManager;
  const canUpdateStock = isDemo || isAdmin || isInventoryManager || isWarehouseManager;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: (!!token && !!user) || isDemo,
      isDemo,
      hasRealAccount,
      realUser,
      restoreRealAccount,
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