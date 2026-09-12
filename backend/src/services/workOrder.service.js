/**
 * services/workOrder.service.js - Work Order business logic
 *
 * ADMIN creates work orders, which check inventory and calculate shortage.
 * Shortage = Required Quantity - Available Quantity (min 0)
 */

const { prisma } = require('../config/database');
const { NotFoundError, ValidationError, ConflictError } = require('../errors');
const { generateWorkOrderNumber } = require('../utils/generateNumber');

// Valid status transitions for work orders
const VALID_TRANSITIONS = {
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
};

/**
 * Create a new work order and check inventory shortage
 */
const createWorkOrder = async ({ itemId, locationId, assignedUserId, requiredQty, notes }) => {
  // Validate referenced entities
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Item not found');

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new NotFoundError('Location not found');

  const assignedUser = await prisma.user.findUnique({ where: { id: assignedUserId } });
  if (!assignedUser) throw new NotFoundError('Assigned user not found');

  // Check available inventory at the specified location
  const inventory = await prisma.inventory.findFirst({
    where: { itemId, locationId },
  });

  let availableQty = 0;
  if (inventory) {
    availableQty = parseFloat(inventory.physicalQty) - parseFloat(inventory.reservedQty);
  }

  // Calculate shortage
  const shortage = Math.max(0, requiredQty - availableQty);

  // Generate unique order number
  let orderNumber;
  let attempts = 0;
  do {
    orderNumber = generateWorkOrderNumber();
    const exists = await prisma.workOrder.findUnique({ where: { orderNumber } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const workOrder = await prisma.workOrder.create({
    data: {
      orderNumber,
      itemId,
      locationId,
      assignedUserId,
      requiredQty,
      notes,
    },
    include: {
      item: { include: { category: true } },
      location: true,
      assignedUser: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return {
    ...workOrder,
    requiredQty: parseFloat(workOrder.requiredQty),
    availableQty,
    shortage,
  };
};

/**
 * Get all work orders
 */
const getAllWorkOrders = async () => {
  const orders = await prisma.workOrder.findMany({
    include: {
      item: { include: { category: true } },
      location: true,
      assignedUser: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich each work order with current shortage calculation
  return Promise.all(
    orders.map(async (wo) => {
      const inventory = await prisma.inventory.findFirst({
        where: { itemId: wo.itemId, locationId: wo.locationId },
      });
      const availableQty = inventory
        ? parseFloat(inventory.physicalQty) - parseFloat(inventory.reservedQty)
        : 0;
      const shortage = Math.max(0, parseFloat(wo.requiredQty) - availableQty);

      return {
        ...wo,
        requiredQty: parseFloat(wo.requiredQty),
        availableQty,
        shortage,
      };
    })
  );
};

/**
 * Get a single work order by ID with shortage info
 */
const getWorkOrderById = async (id) => {
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      item: { include: { category: true } },
      location: true,
      assignedUser: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!wo) throw new NotFoundError('Work order not found');

  const inventory = await prisma.inventory.findFirst({
    where: { itemId: wo.itemId, locationId: wo.locationId },
  });
  const availableQty = inventory
    ? parseFloat(inventory.physicalQty) - parseFloat(inventory.reservedQty)
    : 0;
  const shortage = Math.max(0, parseFloat(wo.requiredQty) - availableQty);

  return { ...wo, requiredQty: parseFloat(wo.requiredQty), availableQty, shortage };
};

/**
 * Update work order status (with transition validation)
 */
const updateWorkOrderStatus = async (id, newStatus) => {
  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) throw new NotFoundError('Work order not found');

  const allowedNext = VALID_TRANSITIONS[wo.status];
  if (!allowedNext.includes(newStatus)) {
    throw new ConflictError(
      `Cannot transition from ${wo.status} to ${newStatus}. ` +
        `Allowed: ${allowedNext.length ? allowedNext.join(', ') : 'none (final state)'}`
    );
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: { status: newStatus },
    include: {
      item: { include: { category: true } },
      location: true,
      assignedUser: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return { ...updated, requiredQty: parseFloat(updated.requiredQty) };
};

module.exports = { createWorkOrder, getAllWorkOrders, getWorkOrderById, updateWorkOrderStatus };
