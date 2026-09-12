/**
 * App.jsx - Root React component with routing
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import TransfersPage from './pages/TransfersPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected - all authenticated users */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          } />

          {/* ADMIN + OPERATIONS_USER only */}
          <Route path="/work-orders" element={
            <ProtectedRoute roles={['ADMIN', 'OPERATIONS_USER']}>
              <WorkOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/transfers" element={
            <ProtectedRoute roles={['ADMIN', 'OPERATIONS_USER']}>
              <TransfersPage />
            </ProtectedRoute>
          } />

          {/* SALES_USER + ADMIN only */}
          <Route path="/orders" element={
            <ProtectedRoute roles={['SALES_USER', 'ADMIN']}>
              <CustomerOrdersPage />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
