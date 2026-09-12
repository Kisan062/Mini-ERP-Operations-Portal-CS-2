/**
 * services/order.service.js - Customer Order & Reservation business logic
 *
 * CRITICAL: Stock reservation uses PostgreSQL row-level locking (SELECT FOR UPDATE)
 * to prevent race conditions when multiple users try to reserve the same stock.
 *
 * Flow:
 * 1. BEGIN transaction
 * 2. Lock inventory row with FOR UPDATE
 * 3. Check available = physical - reserved >= requested
 * 4. Increment reserved_qty
 * 5. Create/update order item
 * 6. COMMIT (or ROLLBACK on failure)
 */

const { prisma } = require('../config/database');
const {
  NotFoundError,
  InsufficientStockError,
  DuplicateOperationError,
  ConflictError,
} = require('../errors');
const { generateOrderNumber } = require('../utils/generateNumber');

/**
 * Create a customer order (without reserving stock yet)
 */
const createOrder = async ({ customerName, notes, items, createdById }) => {
  // Validate all items exist
  for (const item of items) {
    const inv = await prisma.inventory.findUnique({ where: { id: item.inventoryId } });
    if (!inv) throw new NotFoundError(`Inventory record not found: ${item.inventoryId}`);

    const itm = await prisma.item.findUnique({ where: { id: item.itemId } });
    if (!itm) throw new NotFoundError(`Item not found: ${item.itemId}`);
  }

  // Generate unique order number
  let orderNumber;
  let attempts = 0;
  do {
    orderNumber = generateOrderNumber();
    const exists = await prisma.customerOrder.findUnique({ where: { orderNumber } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const order = await prisma.customerOrder.create({
    data: {
      orderNumber,
      customerName,
      createdById,
      notes,
      orderItems: {
        create: items.map((item) => ({
          itemId: item.itemId,
          inventoryId: item.inventoryId,
          requestedQty: item.requestedQty,
        })),
      },
    },
    include: {
      orderItems: {
        include: {
          item: true,
          inventory: {
            include: { location: true, batch: true },
          },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return formatOrder(order);
};

/**
 * Get all customer orders
 */
const getAllOrders = async () => {
  const orders = await prisma.customerOrder.findMany({
    include: {
      orderItems: {
        include: {
          item: { include: { category: true } },
          inventory: { include: { location: true, batch: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return orders.map(formatOrder);
};

/**
 * Get a single order by ID
 */
const getOrderById = async (id) => {
  const order = await prisma.customerOrder.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          item: { include: { category: true } },
          inventory: { include: { location: true, batch: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) throw new NotFoundError('Customer order not found');
  return formatOrder(order);
};

/**
 * Reserve stock for ALL items in a customer order.
 *
 * This is the CONCURRENCY-SAFE operation:
 * - Each inventory row is locked with SELECT ... FOR UPDATE
 * - The entire reservation is atomic (all or nothing)
 */
const reserveOrder = async (orderId) => {
  // Pre-check: order must exist and be in PENDING state
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });

  if (!order) throw new NotFoundError('Customer order not found');
  if (order.status !== 'PENDING') {
    throw new DuplicateOperationError(
      `Order is already ${order.status}. Cannot reserve again.`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedItems = [];

    for (const orderItem of order.orderItems) {
      if (orderItem.isReserved) continue; // Skip already reserved items

      // ─── LOCK the inventory row ───────────────────────────────────────────
      // This prevents concurrent transactions from reading stale data
      const invRows = await tx.$queryRaw`
        SELECT * FROM inventory WHERE id = ${orderItem.inventoryId} FOR UPDATE
      `;
      const inv = invRows[0];

      if (!inv) {
        throw new NotFoundError(`Inventory row not found: ${orderItem.inventoryId}`);
      }

      const available = parseFloat(inv.physical_qty) - parseFloat(inv.reserved_qty);
      const requested = parseFloat(orderItem.requestedQty);

      // ─── CHECK availability ───────────────────────────────────────────────
      if (requested > available) {
        throw new InsufficientStockError(
          `Insufficient stock. Available: ${available.toFixed(3)}, Requested: ${requested.toFixed(3)}`
        );
      }

      // ─── INCREMENT reserved quantity ──────────────────────────────────────
      await tx.inventory.update({
        where: { id: inv.id },
        data: { reservedQty: { increment: requested } },
      });

      // ─── Mark order item as reserved ─────────────────────────────────────
      const updatedItem = await tx.customerOrderItem.update({
        where: { id: orderItem.id },
        data: {
          reservedQty: requested,
          isReserved: true,
          reservedAt: new Date(),
        },
      });

      // ─── Log the reservation transaction ─────────────────────────────────
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          transactionType: 'RESERVATION',
          quantity: requested,
          referenceType: 'ORDER',
          referenceId: orderId,
          notes: `Reserved for order ${order.orderNumber}`,
        },
      });

      updatedItems.push(updatedItem);
    }

    // Mark the whole order as RESERVED
    return tx.customerOrder.update({
      where: { id: orderId },
      data: { status: 'RESERVED' },
      include: {
        orderItems: {
          include: {
            item: { include: { category: true } },
            inventory: { include: { location: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }, { maxWait: 10000, timeout: 30000 });

  return formatOrder(result);
};

/**
 * Helper to format order data with parsed Decimal fields
 */
const formatOrder = (order) => ({
  ...order,
  orderItems: order.orderItems.map((item) => ({
    ...item,
    requestedQty: parseFloat(item.requestedQty),
    reservedQty: parseFloat(item.reservedQty),
    inventory: item.inventory
      ? {
          ...item.inventory,
          physicalQty: parseFloat(item.inventory.physicalQty),
          reservedQty: parseFloat(item.inventory.reservedQty),
          availableQty:
            parseFloat(item.inventory.physicalQty) -
            parseFloat(item.inventory.reservedQty),
        }
      : null,
  })),
});

module.exports = { createOrder, getAllOrders, getOrderById, reserveOrder };
