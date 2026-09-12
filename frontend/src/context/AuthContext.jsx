/**
 * context/AuthContext.jsx - Global Authentication State
 * Provides user info and auth methods to all child components
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Login: call API, persist token + user in localStorage
   */
  const login = async (email, password) => {
    const response = await apiLogin(email, password);
    const { token: newToken, user: newUser } = response.data.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('erp_token', newToken);
    localStorage.setItem('erp_user', JSON.stringify(newUser));

    return newUser;
  };

  /**
   * Logout: clear state and storage
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (...roles) => user && roles.includes(user.role);

  const value = { user, token, loading, login, logout, hasRole, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
