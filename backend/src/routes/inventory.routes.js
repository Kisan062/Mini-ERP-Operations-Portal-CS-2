/**
 * routes/inventory.routes.js - Inventory management endpoints
 */

const router = require('express').Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
  createInventorySchema,
  addStockSchema,
} = require('../validators/inventory.validators');

// All inventory routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory records
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of inventory records with availableQty calculated
 */
router.get('/', inventoryController.getAll);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create new inventory record (OPERATIONS_USER only)
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, locationId, physicalQty]
 *             properties:
 *               itemId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               batchId:
 *                 type: string
 *               physicalQty:
 *                 type: number
 *     responses:
 *       201:
 *         description: Inventory record created
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authorize('OPERATIONS_USER', 'ADMIN'),
  validate(createInventorySchema),
  inventoryController.create
);

/**
 * @swagger
 * /api/inventory/add-stock:
 *   post:
 *     summary: Add stock to existing inventory record
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/add-stock',
  authorize('OPERATIONS_USER', 'ADMIN'),
  validate(addStockSchema),
  inventoryController.addStock
);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory record by ID
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', inventoryController.getById);

/**
 * @swagger
 * /api/inventory/{id}/transactions:
 *   get:
 *     summary: Get transaction history for an inventory record
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id/transactions', inventoryController.getTransactions);

module.exports = router;
