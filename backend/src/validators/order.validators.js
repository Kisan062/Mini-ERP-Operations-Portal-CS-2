/**
 * validators/order.validators.js - Zod schemas for customer order endpoints
 */

const { z } = require('zod');

const createOrderSchema = z.object({
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .min(2, 'Customer name must be at least 2 characters')
    .max(200)
    .trim(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid('Invalid item ID'),
        inventoryId: z.string().uuid('Invalid inventory ID'),
        requestedQty: z
          .number({ required_error: 'Requested quantity is required' })
          .positive('Requested quantity must be greater than 0'),
      })
    )
    .min(1, 'At least one item is required'),
});

const reserveOrderSchema = z.object({
  itemId: z.string().uuid('Invalid item ID').optional(),
  inventoryId: z.string().uuid('Invalid inventory ID').optional(),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than 0')
    .optional(),
});

module.exports = { createOrderSchema, reserveOrderSchema };
