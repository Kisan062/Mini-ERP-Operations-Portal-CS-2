/**
 * services/transfer.service.js - Stock Transfer business logic
 *
 * CRITICAL RULES:
 * - DISPATCH: Reduce source inventory (NOT destination)
 * - RECEIVE: Increase destination inventory
 * - Cannot receive twice (DuplicateOperationError)
 * - Cannot transfer more than available at source
 * - Uses PostgreSQL transactions for dispatch & receive
 */

const { prisma, getTableName } = require('../config/database');
const {
  NotFoundError,
  InsufficientStockError,
  DuplicateOperationError,
  ConflictError,
} = require('../errors');
const { generateTransferNumber } = require('../utils/generateNumber');

/**
 * Create a new stock transfer request
 */
const createTransfer = async ({
  itemId,
  sourceLocationId,
  destLocationId,
  quantity,
  notes,
}) => {
  // Validate entities
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Item not found');

  const sourceLoc = await prisma.location.findUnique({ where: { id: sourceLocationId } });
  if (!sourceLoc) throw new NotFoundError('Source location not found');

  const destLoc = await prisma.location.findUnique({ where: { id: destLocationId } });
  if (!destLoc) throw new NotFoundError('Destination location not found');

  // Check source has enough available inventory
  const sourceInv = await prisma.inventory.findFirst({
    where: { itemId, locationId: sourceLocationId },
  });

  if (!sourceInv) {
    throw new InsufficientStockError(
      `No inventory found for this item at location: ${sourceLoc.name}`
    );
  }

  const available = parseFloat(sourceInv.physicalQty) - parseFloat(sourceInv.reservedQty);
  if (quantity > available) {
    throw new InsufficientStockError(
      `Insufficient stock at ${sourceLoc.name}. Available: ${available}, Requested: ${quantity}`
    );
  }

  // Generate unique transfer number
  let transferNumber;
  let attempts = 0;
  do {
    transferNumber = generateTransferNumber();
    const exists = await prisma.stockTransfer.findUnique({ where: { transferNumber } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const transfer = await prisma.stockTransfer.create({
    data: {
      transferNumber,
      itemId,
      sourceLocationId,
      destLocationId,
      quantity,
      notes,
    },
    include: {
      item: true,
      sourceLocation: true,
      destLocation: true,
    },
  });

  return { ...transfer, quantity: parseFloat(transfer.quantity) };
};

/**
 * Get all stock transfers
 */
const getAllTransfers = async () => {
  const transfers = await prisma.stockTransfer.findMany({
    include: {
      item: { include: { category: true } },
      sourceLocation: true,
      destLocation: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return transfers.map((t) => ({ ...t, quantity: parseFloat(t.quantity) }));
};

/**
 * Get a single transfer by ID
 */
const getTransferById = async (id) => {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: {
      item: { include: { category: true } },
      sourceLocation: true,
      destLocation: true,
    },
  });
  if (!transfer) throw new NotFoundError('Transfer not found');
  return { ...transfer, quantity: parseFloat(transfer.quantity) };
};

/**
 * DISPATCH a transfer:
 * - Status must be REQUESTED
 * - Deduct quantity from SOURCE inventory
 * - Do NOT touch destination yet
 * - Uses a DB transaction
 */
const dispatchTransfer = async (id) => {
  // Pre-check status outside transaction
  const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
  if (!transfer) throw new NotFoundError('Transfer not found');
  if (transfer.status !== 'REQUESTED') {
    throw new ConflictError(
      `Transfer cannot be dispatched. Current status: ${transfer.status}`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Lock the source inventory row to prevent concurrent modifications
    const inventoryTable = getTableName('inventory');
    const sourceInvRows = await tx.$queryRaw`
      SELECT * FROM ${inventoryTable}
      WHERE item_id = ${transfer.itemId}
        AND location_id = ${transfer.sourceLocationId}
      LIMIT 1
      FOR UPDATE
    `;

    const sourceInv = sourceInvRows[0];
    if (!sourceInv) {
      throw new InsufficientStockError('Source inventory record not found');
    }

    const available =
      parseFloat(sourceInv.physical_qty) - parseFloat(sourceInv.reserved_qty);
    const qty = parseFloat(transfer.quantity);

    if (qty > available) {
      throw new InsufficientStockError(
        `Insufficient stock to dispatch. Available: ${available}, Required: ${qty}`
      );
    }

    // Reduce source physical quantity
    await tx.inventory.update({
      where: { id: sourceInv.id },
      data: { physicalQty: { decrement: qty } },
    });

    // Log the outbound transaction
    await tx.inventoryTransaction.create({
      data: {
        inventoryId: sourceInv.id,
        transactionType: 'TRANSFER_OUT',
        quantity: qty,
        referenceType: 'TRANSFER',
        referenceId: id,
        notes: `Dispatched via transfer ${transfer.transferNumber}`,
      },
    });

    // Update transfer status
    return tx.stockTransfer.update({
      where: { id },
      data: { status: 'DISPATCHED', dispatchedAt: new Date() },
      include: {
        item: { include: { category: true } },
        sourceLocation: true,
        destLocation: true,
      },
    });
  }, { maxWait: 10000, timeout: 30000 });

  return { ...result, quantity: parseFloat(result.quantity) };
};

/**
 * RECEIVE a transfer:
 * - Status must be DISPATCHED (cannot receive twice)
 * - Add quantity to DESTINATION inventory
 * - Uses a DB transaction
 */
const receiveTransfer = async (id) => {
  const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
  if (!transfer) throw new NotFoundError('Transfer not found');

  if (transfer.status === 'RECEIVED') {
    throw new DuplicateOperationError('This transfer has already been received');
  }

  if (transfer.status !== 'DISPATCHED') {
    throw new ConflictError(
      `Transfer cannot be received. Current status: ${transfer.status}. Must be DISPATCHED first.`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const qty = parseFloat(transfer.quantity);

    // Find or create destination inventory record
    let destInv = await tx.inventory.findFirst({
      where: { itemId: transfer.itemId, locationId: transfer.destLocationId },
    });

    if (destInv) {
      // Increase destination physical quantity
      destInv = await tx.inventory.update({
        where: { id: destInv.id },
        data: { physicalQty: { increment: qty } },
      });
    } else {
      // Create new inventory record at destination
      destInv = await tx.inventory.create({
        data: {
          itemId: transfer.itemId,
          locationId: transfer.destLocationId,
          physicalQty: qty,
          reservedQty: 0,
        },
      });
    }

    // Log the inbound transaction at destination
    await tx.inventoryTransaction.create({
      data: {
        inventoryId: destInv.id,
        transactionType: 'TRANSFER_IN',
        quantity: qty,
        referenceType: 'TRANSFER',
        referenceId: id,
        notes: `Received via transfer ${transfer.transferNumber}`,
      },
    });

    // Update transfer status to RECEIVED
    return tx.stockTransfer.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
      include: {
        item: { include: { category: true } },
        sourceLocation: true,
        destLocation: true,
      },
    });
  }, { maxWait: 10000, timeout: 30000 });

  return { ...result, quantity: parseFloat(result.quantity) };
};

module.exports = {
  createTransfer,
  getAllTransfers,
  getTransferById,
  dispatchTransfer,
  receiveTransfer,
};
