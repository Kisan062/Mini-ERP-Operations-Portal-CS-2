/**
 * validators/auth.validators.js - Zod schemas for authentication endpoints
 */

const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

module.exports = { loginSchema };
