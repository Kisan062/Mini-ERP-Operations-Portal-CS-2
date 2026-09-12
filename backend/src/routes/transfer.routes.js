/**
 * routes/transfer.routes.js - Stock Transfer endpoints
 * OPERATIONS_USER manages all transfer operations
 */

const router = require('express').Router();
const transferController = require('../controllers/transfer.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createTransferSchema } = require('../validators/transfer.validators');

router.use(authenticate);
router.use(authorize('OPERATIONS_USER', 'ADMIN'));

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     summary: Get all stock transfers
 *     tags: [Stock Transfers]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', transferController.getAll);

/**
 * @swagger
 * /api/transfers:
 *   post:
 *     summary: Create a new stock transfer request
 *     tags: [Stock Transfers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, sourceLocationId, destLocationId, quantity]
 *             properties:
 *               itemId:
 *                 type: string
 *               sourceLocationId:
 *                 type: string
 *               destLocationId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               notes:
 *                 type: string
 */
router.post('/', validate(createTransferSchema), transferController.create);

/**
 * @swagger
 * /api/transfers/{id}:
 *   get:
 *     summary: Get a specific transfer by ID
 *     tags: [Stock Transfers]
 */
router.get('/:id', transferController.getById);

/**
 * @swagger
 * /api/transfers/{id}/dispatch:
 *   post:
 *     summary: Dispatch a transfer (reduces source inventory)
 *     tags: [Stock Transfers]
 *     description: |
 *       Dispatching reduces the SOURCE inventory physical quantity.
 *       The DESTINATION inventory is NOT changed until received.
 *     responses:
 *       200:
 *         description: Transfer dispatched, source inventory reduced
 *       409:
 *         description: Transfer already dispatched or received
 */
router.post('/:id/dispatch', transferController.dispatch);

/**
 * @swagger
 * /api/transfers/{id}/receive:
 *   post:
 *     summary: Receive a transfer (increases destination inventory)
 *     tags: [Stock Transfers]
 *     description: |
 *       Receiving increases the DESTINATION inventory physical quantity.
 *       Can only be received once. Raises 409 if already received.
 *     responses:
 *       200:
 *         description: Transfer received, destination inventory increased
 *       409:
 *         description: Transfer already received (DuplicateOperationError)
 */
router.post('/:id/receive', transferController.receive);

module.exports = router;
