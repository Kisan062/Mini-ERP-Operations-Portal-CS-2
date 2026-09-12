/**
 * api/workOrders.api.js - Work Orders API calls
 */

import api from './axios';

export const getWorkOrders = () => api.get('/api/work-orders');
export const getWorkOrderById = (id) => api.get(`/api/work-orders/${id}`);
export const createWorkOrder = (data) => api.post('/api/work-orders', data);
export const updateWorkOrderStatus = (id, status) =>
  api.put(`/api/work-orders/${id}/status`, { status });
