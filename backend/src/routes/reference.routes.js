/**
 * routes/reference.routes.js - Master data endpoints
 * Categories, Items, Locations, Batches, Users
 */

const router = require('express').Router();
const refController = require('../controllers/reference.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

// Categories
router.get('/categories', refController.getCategories);
router.post('/categories', authorize('ADMIN'), refController.createCategory);

// Items
router.get('/items', refController.getItems);
router.post('/items', authorize('ADMIN', 'OPERATIONS_USER'), refController.createItem);

// Locations
router.get('/locations', refController.getLocations);
router.post('/locations', authorize('ADMIN'), refController.createLocation);

// Batches
router.get('/batches', refController.getBatches);
router.post('/batches', authorize('ADMIN', 'OPERATIONS_USER'), refController.createBatch);

// Users (for assignment dropdowns)
router.get('/users', refController.getUsers);

module.exports = router;
