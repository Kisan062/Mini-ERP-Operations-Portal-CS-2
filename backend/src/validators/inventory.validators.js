/**
 * validators/inventory.validators.js - Zod schemas for inventory endpoints
 */

const { z } = require('zod');

const positiveDecimal = (fieldName) =>
  z
    .number({ required_error: `${fieldName} is required` })
    .positive(`${fieldName} must be greater than 0`);

const createInventorySchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  locationId: z.string().uuid('Invalid location ID'),
  batchId: z.string().uuid('Invalid batch ID').optional().nullable(),
  physicalQty: positiveDecimal('Physical quantity'),
});

const updateInventorySchema = z.object({
  physicalQty: z
    .number()
    .nonnegative('Physical quantity cannot be negative')
    .optional(),
  notes: z.string().max(500).optional(),
});

const addStockSchema = z.object({
  inventoryId: z.string().uuid('Invalid inventory ID'),
  quantity: positiveDecimal('Quantity'),
  notes: z.string().max(500).optional(),
});

module.exports = { createInventorySchema, updateInventorySchema, addStockSchema };
