/**
 * routes/workOrder.routes.js - Work Order endpoints
 * ADMIN: create work orders
 * ADMIN + OPERATIONS_USER: view and update status
 */

const router = require('express').Router();
const workOrderController = require('../controllers/workOrder.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
} = require('../validators/workOrder.validators');

router.use(authenticate);

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     summary: Get all work orders with shortage calculation
 *     tags: [Work Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of work orders with availableQty and shortage fields
 */
router.get('/', authorize('ADMIN', 'OPERATIONS_USER'), workOrderController.getAll);

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     summary: Create a new work order (ADMIN only)
 *     tags: [Work Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, locationId, assignedUserId, requiredQty]
 *             properties:
 *               itemId:
 *                 type: string
 *               locationId:
 *                 type: string
 *               assignedUserId:
 *                 type: string
 *               requiredQty:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Work order created with shortage calculated
 *       403:
 *         description: Only ADMIN can create work orders
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate(createWorkOrderSchema),
  workOrderController.create
);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     summary: Get a specific work order by ID
 *     tags: [Work Orders]
 */
router.get('/:id', authorize('ADMIN', 'OPERATIONS_USER'), workOrderController.getById);

/**
 * @swagger
 * /api/work-orders/{id}/status:
 *   put:
 *     summary: Update work order status
 *     tags: [Work Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ASSIGNED, IN_PROGRESS, COMPLETED]
 */
router.put(
  '/:id/status',
  authorize('ADMIN', 'OPERATIONS_USER'),
  validate(updateWorkOrderStatusSchema),
  workOrderController.updateStatus
);

module.exports = router;
