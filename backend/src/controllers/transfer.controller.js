/**
 * controllers/transfer.controller.js - HTTP handlers for stock transfers
 */

const transferService = require('../services/transfer.service');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const data = await transferService.getAllTransfers();
    sendList(res, data, data.length);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await transferService.getTransferById(req.params.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await transferService.createTransfer(req.body);
    sendCreated(res, data, 'Stock transfer created');
  } catch (error) {
    next(error);
  }
};

const dispatch = async (req, res, next) => {
  try {
    const data = await transferService.dispatchTransfer(req.params.id);
    sendSuccess(res, data, 'Transfer dispatched. Source inventory reduced.');
  } catch (error) {
    next(error);
  }
};

const receive = async (req, res, next) => {
  try {
    const data = await transferService.receiveTransfer(req.params.id);
    sendSuccess(res, data, 'Transfer received. Destination inventory increased.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, dispatch, receive };
