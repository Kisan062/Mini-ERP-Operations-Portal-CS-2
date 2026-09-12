/**
 * api/transfers.api.js - Stock Transfer API calls
 */

import api from './axios';

export const getTransfers = () => api.get('/api/transfers');
export const getTransferById = (id) => api.get(`/api/transfers/${id}`);
export const createTransfer = (data) => api.post('/api/transfers', data);
export const dispatchTransfer = (id) => api.post(`/api/transfers/${id}/dispatch`);
export const receiveTransfer = (id) => api.post(`/api/transfers/${id}/receive`);
