/**
 * services/inventory.service.js - Inventory management business logic
 *
 * KEY RULE: Available Quantity = Physical Quantity - Reserved Quantity
 * Backend enforces: no negative inventory, no reservation beyond available
 */

const { prisma } = require('../config/database');
const {
  NotFoundError,
  ValidationError,
  InsufficientStockError,
} = require('../errors');

/**
 * Compute available quantity from a raw inventory record
 */
const computeAvailable = (inv) => {
  return parseFloat(inv.physicalQty) - parseFloat(inv.reservedQty);
};

/**
 * Get all inventory records with joined item/location/batch/category data
 */
const getAllInventory = async () => {
  const records = await prisma.inventory.findMany({
    include: {
      item: { include: { category: true } },
      location: true,
      batch: true,
    },
    orderBy: [{ item: { name: 'asc' } }, { location: { name: 'asc' } }],
  });

  return records.map((inv) => ({
    ...inv,
    physicalQty: parseFloat(inv.physicalQty),
    reservedQty: parseFloat(inv.reservedQty),
    availableQty: computeAvailable(inv),
  }));
};

/**
 * Get a single inventory record by ID
 */
const getInventoryById = async (id) => {
  const inv = await prisma.inventory.findUnique({
    where: { id },
    include: {
      item: { include: { category: true } },
      location: true,
      batch: true,
    },
  });

  if (!inv) throw new NotFoundError('Inventory record not found');

  return {
    ...inv,
    physicalQty: parseFloat(inv.physicalQty),
    reservedQty: parseFloat(inv.reservedQty),
    availableQty: computeAvailable(inv),
  };
};

/**
 * Create a new inventory record (item + location + batch combination)
 */
const createInventory = async ({ itemId, locationId, batchId, physicalQty }) => {
  // Validate referenced entities exist
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Item not found');

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new NotFoundError('Location not found');

  if (batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundError('Batch not found');
  }

  // Check for duplicate combination
  const existing = await prisma.inventory.findFirst({
    where: { itemId, locationId, batchId: batchId || null },
  });
  if (existing) {
    throw new ValidationError(
      'Inventory record already exists for this item/location/batch combination'
    );
  }

  const inv = await prisma.inventory.create({
    data: { itemId, locationId, batchId: batchId || null, physicalQty },
    include: {
      item: { include: { category: true } },
      location: true,
      batch: true,
    },
  });

  // Log the initial stock entry
  await prisma.inventoryTransaction.create({
    data: {
      inventoryId: inv.id,
      transactionType: 'INBOUND',
      quantity: physicalQty,
      notes: 'Initial stock entry',
    },
  });

  return {
    ...inv,
    physicalQty: parseFloat(inv.physicalQty),
    reservedQty: parseFloat(inv.reservedQty),
    availableQty: computeAvailable(inv),
  };
};

/**
 * Add stock to an existing inventory record (increases physical quantity)
 */
const addStock = async (inventoryId, quantity, notes) => {
  if (quantity <= 0) throw new ValidationError('Quantity must be positive');

  const inv = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!inv) throw new NotFoundError('Inventory record not found');

  const updated = await prisma.inventory.update({
    where: { id: inventoryId },
    data: { physicalQty: { increment: quantity } },
    include: {
      item: { include: { category: true } },
      location: true,
      batch: true,
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      inventoryId,
      transactionType: 'INBOUND',
      quantity,
      notes: notes || 'Stock addition',
    },
  });

  return {
    ...updated,
    physicalQty: parseFloat(updated.physicalQty),
    reservedQty: parseFloat(updated.reservedQty),
    availableQty: computeAvailable(updated),
  };
};

/**
 * Get inventory transaction history for an inventory record
 */
const getTransactions = async (inventoryId) => {
  const inv = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!inv) throw new NotFoundError('Inventory record not found');

  return prisma.inventoryTransaction.findMany({
    where: { inventoryId },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  addStock,
  getTransactions,
  computeAvailable,
};
