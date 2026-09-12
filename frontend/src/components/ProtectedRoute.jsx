/**
 * components/ProtectedRoute.jsx - Route guard component
 * Redirects to /login if not authenticated
 * Shows 403 if authenticated but wrong role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check that user has one of them
  if (roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚫</div>
          <h2 style={{ marginBottom: '8px' }}>Access Denied</h2>
          <p className="text-muted">You don&apos;t have permission to view this page.</p>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.8rem' }}>
            Required role(s): {roles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
