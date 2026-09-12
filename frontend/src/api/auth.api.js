/**
 * api/auth.api.js - Authentication API calls
 */

import api from './axios';

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const getProfile = () =>
  api.get('/api/auth/profile');
