/**
 * pages/LoginPage.jsx - Login screen
 * Handles authentication and role-based redirect
 */

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@erp.com', password: 'Admin@123' },
      ops: { email: 'ops@erp.com', password: 'Ops@123' },
      sales: { email: 'sales@erp.com', password: 'Sales@123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⊞</div>
          <h1>Mini ERP</h1>
          <p>Operations Management System</p>
        </div>

        <AlertMessage type="error" message={error} onClose={() => setError('')} />

        <form id="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick demo login buttons */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <p className="text-muted text-center" style={{ fontSize: '0.78rem', marginBottom: '10px' }}>
            Demo Accounts
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              id="demo-admin"
              type="button"
              className="btn btn-outline btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => fillDemo('admin')}
            >
              Admin
            </button>
            <button
              id="demo-ops"
              type="button"
              className="btn btn-outline btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => fillDemo('ops')}
            >
              Operations
            </button>
            <button
              id="demo-sales"
              type="button"
              className="btn btn-outline btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => fillDemo('sales')}
            >
              Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
