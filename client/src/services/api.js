import axios from 'axios';
import {
  DEMO_USERS,
  DEMO_WAREHOUSES,
  DEMO_PRODUCTS,
  DEMO_BATCHES,
  DEMO_INVENTORY,
  DEMO_SHIPMENTS,
  DEMO_STOCK_MOVEMENTS,
  DEMO_ALERTS,
  DEMO_AUDIT_LOGS,
  DEMO_DASHBOARD_METRICS
} from './demoData';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:5000/api';
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Demo Mode Request Handler (Protects live database & serves simulated datasets)
const handleDemoRequest = async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const rawUrl = config.url || '';
  const url = rawUrl.replace(/^\/api/, '');

  // AI Assistant in demo mode provides simulated guidance
  if (url.includes('/ai/chat')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        success: true,
        message: 'Hello! I am your PharmaTrack AI Assistant in Demo Mode. All operational metrics, cold-chain telemetry, and FEFO expiry warnings currently displayed are simulated. To execute operational workflows, please sign in with an authorized account.'
      }
    };
  }

  // Prevent ANY database modifications in Demo Mode
  if (method !== 'get') {
    if (url.includes('/alerts/') && (url.includes('/read') || url.includes('/resolve'))) {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { success: true, message: 'Alert state updated in demo sandbox.' }
      };
    }

    const error = new Error('Database modification is disabled in Demo Mode. Please sign in to modify the database.');
    error.response = {
      status: 403,
      data: {
        success: false,
        message: 'Database modification is disabled in Demo Mode. Please sign in with an authorized account.'
      }
    };
    return Promise.reject(error);
  }

  // Serve simulated data for GET endpoints
  let responseData = null;

  if (url.includes('/analytics/dashboard')) {
    responseData = DEMO_DASHBOARD_METRICS;
  } else if (url.includes('/analytics')) {
    responseData = {
      success: true,
      metrics: DEMO_DASHBOARD_METRICS,
      summary: { totalValuation: 48920000, complianceRate: '99.4%' }
    };
  } else if (url.match(/\/products\/[a-zA-Z0-9_-]+/)) {
    const id = url.split('/').filter(Boolean).pop();
    const product = DEMO_PRODUCTS.find(p => p._id === id) || DEMO_PRODUCTS[0];
    responseData = { success: true, product };
  } else if (url.includes('/products')) {
    responseData = {
      success: true,
      data: DEMO_PRODUCTS,
      pagination: { total: DEMO_PRODUCTS.length, page: 1, limit: 10, totalPages: 1 }
    };
  } else if (url.match(/\/warehouses\/[a-zA-Z0-9_-]+/)) {
    const id = url.split('/').filter(Boolean).pop();
    const warehouse = DEMO_WAREHOUSES.find(w => w._id === id) || DEMO_WAREHOUSES[0];
    responseData = { success: true, warehouse };
  } else if (url.includes('/warehouses')) {
    responseData = { success: true, data: DEMO_WAREHOUSES };
  } else if (url.match(/\/batches\/[a-zA-Z0-9_-]+/)) {
    const id = url.split('/').filter(Boolean).pop();
    const batch = DEMO_BATCHES.find(b => b._id === id) || DEMO_BATCHES[0];
    responseData = { success: true, batch };
  } else if (url.includes('/batches')) {
    responseData = {
      success: true,
      data: DEMO_BATCHES,
      pagination: { total: DEMO_BATCHES.length, page: 1, limit: 10, totalPages: 1 }
    };
  } else if (url.includes('/inventory/movements')) {
    responseData = {
      success: true,
      data: DEMO_STOCK_MOVEMENTS,
      pagination: { total: DEMO_STOCK_MOVEMENTS.length, page: 1, limit: 15, totalPages: 1 }
    };
  } else if (url.includes('/inventory')) {
    responseData = {
      success: true,
      data: DEMO_INVENTORY,
      pagination: { total: DEMO_INVENTORY.length, page: 1, limit: 15, totalPages: 1 }
    };
  } else if (url.match(/\/shipments\/[a-zA-Z0-9_-]+/)) {
    const id = url.split('/').filter(Boolean).pop();
    const shipment = DEMO_SHIPMENTS.find(s => s._id === id) || DEMO_SHIPMENTS[0];
    responseData = { success: true, shipment };
  } else if (url.includes('/shipments')) {
    responseData = {
      success: true,
      data: DEMO_SHIPMENTS,
      pagination: { total: DEMO_SHIPMENTS.length, page: 1, limit: 15, totalPages: 1 }
    };
  } else if (url.includes('/alerts/summary')) {
    responseData = { success: true, unreadCount: 2, criticalCount: 1 };
  } else if (url.includes('/alerts')) {
    responseData = {
      success: true,
      data: DEMO_ALERTS,
      unreadCount: 2,
      criticalCount: 1,
      pagination: { total: DEMO_ALERTS.length, page: 1, limit: 10, totalPages: 1 }
    };
  } else if (url.includes('/audit')) {
    responseData = {
      success: true,
      data: DEMO_AUDIT_LOGS,
      pagination: { total: DEMO_AUDIT_LOGS.length, page: 1, limit: 15, totalPages: 1 }
    };
  } else if (url.includes('/users')) {
    responseData = {
      success: true,
      data: DEMO_USERS,
      pagination: { total: DEMO_USERS.length, page: 1, limit: 15, totalPages: 1 }
    };
  } else if (url.includes('/search')) {
    responseData = {
      success: true,
      products: DEMO_PRODUCTS.slice(0, 3),
      batches: DEMO_BATCHES.slice(0, 3),
      warehouses: DEMO_WAREHOUSES.slice(0, 2),
      shipments: DEMO_SHIPMENTS.slice(0, 2)
    };
  } else {
    responseData = { success: true, data: [] };
  }

  return {
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    data: responseData
  };
};

// Request Interceptor: Attach JWT token or assign demo adapter
API.interceptors.request.use((config) => {
  const isDemo = localStorage.getItem('pharmatrack_is_demo') === 'true';
  if (isDemo) {
    // Intercept with simulated adapter - never hits the network or backend DB
    config.adapter = handleDemoRequest;
    return config;
  }

  const token = localStorage.getItem('pharmatrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isDemo = localStorage.getItem('pharmatrack_is_demo') === 'true';
    if (error.response?.status === 401 && !isDemo) {
      // Clear token on unauthorized / expired session for real users
      localStorage.removeItem('pharmatrack_token');
      localStorage.removeItem('pharmatrack_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;