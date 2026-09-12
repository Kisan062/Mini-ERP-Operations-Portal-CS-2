/**
 * controllers/reference.controller.js - HTTP handlers for master data
 * Categories, Items, Locations, Batches, Users
 */

const refService = require('../services/reference.service');
const { sendSuccess, sendCreated, sendList } = require('../utils/response');

// Categories
const getCategories = async (req, res, next) => {
  try {
    const data = await refService.getAllCategories();
    sendList(res, data, data.length);
  } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
  try {
    const data = await refService.createCategory(req.body);
    sendCreated(res, data, 'Category created');
  } catch (error) { next(error); }
};

// Items
const getItems = async (req, res, next) => {
  try {
    const data = await refService.getAllItems();
    sendList(res, data, data.length);
  } catch (error) { next(error); }
};

const createItem = async (req, res, next) => {
  try {
    const data = await refService.createItem(req.body);
    sendCreated(res, data, 'Item created');
  } catch (error) { next(error); }
};

// Locations
const getLocations = async (req, res, next) => {
  try {
    const data = await refService.getAllLocations();
    sendList(res, data, data.length);
  } catch (error) { next(error); }
};

const createLocation = async (req, res, next) => {
  try {
    const data = await refService.createLocation(req.body);
    sendCreated(res, data, 'Location created');
  } catch (error) { next(error); }
};

// Batches
const getBatches = async (req, res, next) => {
  try {
    const data = await refService.getAllBatches();
    sendList(res, data, data.length);
  } catch (error) { next(error); }
};

const createBatch = async (req, res, next) => {
  try {
    const data = await refService.createBatch(req.body);
    sendCreated(res, data, 'Batch created');
  } catch (error) { next(error); }
};

// Users (for assignment dropdowns)
const getUsers = async (req, res, next) => {
  try {
    const data = await refService.getAllUsers();
    sendList(res, data, data.length);
  } catch (error) { next(error); }
};

module.exports = {
  getCategories, createCategory,
  getItems, createItem,
  getLocations, createLocation,
  getBatches, createBatch,
  getUsers,
};
