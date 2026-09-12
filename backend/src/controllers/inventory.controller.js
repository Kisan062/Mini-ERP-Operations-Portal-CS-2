/**
 * controllers/inventory.controller.js - HTTP handlers for inventory management
 */

const inventoryService = require('../services/inventory.service');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const data = await inventoryService.getAllInventory();
    sendList(res, data, data.length);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await inventoryService.getInventoryById(req.params.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await inventoryService.createInventory(req.body);
    sendCreated(res, data, 'Inventory record created');
  } catch (error) {
    next(error);
  }
};

const addStock = async (req, res, next) => {
  try {
    const { inventoryId, quantity, notes } = req.body;
    const data = await inventoryService.addStock(inventoryId, quantity, notes);
    sendSuccess(res, data, 'Stock added successfully');
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const data = await inventoryService.getTransactions(req.params.id);
    sendList(res, data, data.length);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, addStock, getTransactions };
