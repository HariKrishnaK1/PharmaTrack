import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AlertProvider } from './context/AlertContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { AddEditProduct } from './pages/AddEditProduct';
import { Inventory } from './pages/Inventory';
import { StockMovements } from './pages/StockMovements';
import { Batches } from './pages/Batches';
import { BatchDetail } from './pages/BatchDetail';
import { Warehouses } from './pages/Warehouses';
import { WarehouseDetail } from './pages/WarehouseDetail';
import { Shipments } from './pages/Shipments';
import { ShipmentDetail } from './pages/ShipmentDetail';
import { CreateShipment } from './pages/CreateShipment';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

// Redirect already-authenticated users away from public pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AlertProvider>
              <Routes>
                {/* Public Landing Page */}
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  }
                />

                {/* Public Authentication Route */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Protected Operations Console Routes */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route
                    path="products/new"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
                        <AddEditProduct />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route
                    path="products/:id/edit"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
                        <AddEditProduct />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="movements" element={<StockMovements />} />
                  <Route path="batches" element={<Batches />} />
                  <Route path="batches/:id" element={<BatchDetail />} />
                  <Route path="warehouses" element={<Warehouses />} />
                  <Route path="warehouses/:id" element={<WarehouseDetail />} />
                  <Route path="shipments" element={<Shipments />} />
                  <Route
                    path="shipments/new"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
                        <CreateShipment />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="shipments/:id" element={<ShipmentDetail />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route
                    path="audit-logs"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AuditLogs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Catch-all → landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AlertProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}