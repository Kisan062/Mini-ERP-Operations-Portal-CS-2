/**
 * routes/order.routes.js - Customer Order endpoints
 * SALES_USER creates orders and reserves stock
 * ADMIN can view all orders
 */

const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createOrderSchema } = require('../validators/order.validators');

router.use(authenticate);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all customer orders
 *     tags: [Customer Orders]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', authorize('SALES_USER', 'ADMIN'), orderController.getAll);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new customer order (SALES_USER only)
 *     tags: [Customer Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, items]
 *             properties:
 *               customerName:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     inventoryId:
 *                       type: string
 *                     requestedQty:
 *                       type: number
 */
router.post(
  '/',
  authorize('SALES_USER'),
  validate(createOrderSchema),
  orderController.create
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a specific customer order by ID
 *     tags: [Customer Orders]
 */
router.get('/:id', authorize('SALES_USER', 'ADMIN'), orderController.getById);

/**
 * @swagger
 * /api/orders/{id}/reserve:
 *   post:
 *     summary: Reserve stock for a customer order (SALES_USER only)
 *     tags: [Customer Orders]
 *     description: |
 *       Uses PostgreSQL row-level locking (SELECT FOR UPDATE) to prevent
 *       race conditions when multiple users reserve the same stock simultaneously.
 *       Only one concurrent request will succeed if stock is insufficient for both.
 *     responses:
 *       200:
 *         description: Stock reserved successfully
 *       400:
 *         description: Insufficient stock available
 *       409:
 *         description: Order already reserved
 */
router.post('/:id/reserve', authorize('SALES_USER'), orderController.reserve);

module.exports = router;
