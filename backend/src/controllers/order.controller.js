/**
 * controllers/order.controller.js - HTTP handlers for customer orders
 */

const orderService = require('../services/order.service');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const data = await orderService.getAllOrders();
    sendList(res, data, data.length);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await orderService.getOrderById(req.params.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await orderService.createOrder({
      ...req.body,
      createdById: req.user.id, // inject authenticated user ID
    });
    sendCreated(res, data, 'Customer order created');
  } catch (error) {
    next(error);
  }
};

const reserve = async (req, res, next) => {
  try {
    const data = await orderService.reserveOrder(req.params.id);
    sendSuccess(res, data, 'Stock reserved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, reserve };
