/**
 * api/inventory.api.js - Inventory API calls
 */

import api from './axios';

export const getInventory = () => api.get('/api/inventory');
export const getInventoryById = (id) => api.get(`/api/inventory/${id}`);
export const createInventory = (data) => api.post('/api/inventory', data);
export const addStock = (data) => api.post('/api/inventory/add-stock', data);
export const getTransactions = (id) => api.get(`/api/inventory/${id}/transactions`);

// Reference data
export const getItems = () => api.get('/api/items');
export const getLocations = () => api.get('/api/locations');
export const getCategories = () => api.get('/api/categories');
export const getBatches = () => api.get('/api/batches');
export const getUsers = () => api.get('/api/users');
