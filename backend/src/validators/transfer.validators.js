/**
 * validators/transfer.validators.js - Zod schemas for stock transfer endpoints
 */

const { z } = require('zod');

const createTransferSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  sourceLocationId: z.string().uuid('Invalid source location ID'),
  destLocationId: z.string().uuid('Invalid destination location ID'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than 0'),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.sourceLocationId !== data.destLocationId,
  {
    message: 'Source and destination locations must be different',
    path: ['destLocationId'],
  }
);

module.exports = { createTransferSchema };
