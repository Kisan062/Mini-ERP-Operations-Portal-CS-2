/**
 * controllers/workOrder.controller.js - HTTP handlers for work orders
 */

const workOrderService = require('../services/workOrder.service');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const data = await workOrderService.getAllWorkOrders();
    sendList(res, data, data.length);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await workOrderService.getWorkOrderById(req.params.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await workOrderService.createWorkOrder(req.body);
    sendCreated(res, data, 'Work order created successfully');
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await workOrderService.updateWorkOrderStatus(
      req.params.id,
      req.body.status
    );
    sendSuccess(res, data, 'Work order status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, updateStatus };
