/**
 * api/orders.api.js - Customer Order API calls
 */

import api from './axios';

export const getOrders = () => api.get('/api/orders');
export const getOrderById = (id) => api.get(`/api/orders/${id}`);
export const createOrder = (data) => api.post('/api/orders', data);
export const reserveOrder = (id) => api.post(`/api/orders/${id}/reserve`);
