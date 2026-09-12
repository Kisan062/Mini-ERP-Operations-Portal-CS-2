/**
 * api/axios.js - Axios instance with JWT interceptor
 * Automatically attaches Authorization header and handles 401 globally
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://mini-erp-operations-portal-cs-2.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// ─── Request Interceptor: Attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
