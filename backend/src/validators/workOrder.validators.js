/**
 * validators/workOrder.validators.js - Zod schemas for work order endpoints
 */

const { z } = require('zod');

const createWorkOrderSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  locationId: z.string().uuid('Invalid location ID'),
  assignedUserId: z.string().uuid('Invalid user ID'),
  requiredQty: z
    .number({ required_error: 'Required quantity is required' })
    .positive('Required quantity must be greater than 0'),
  notes: z.string().max(500).optional(),
});

const updateWorkOrderStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be ASSIGNED, IN_PROGRESS, or COMPLETED',
  }),
});

module.exports = { createWorkOrderSchema, updateWorkOrderStatusSchema };
