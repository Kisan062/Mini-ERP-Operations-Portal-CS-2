/**
 * middleware/validate.js - Zod Request Validation Middleware
 * Validates req.body against a Zod schema before the controller runs
 */

const { ValidationError } = require('../errors');

/**
 * Creates validation middleware from a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of req to validate (default: 'body')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', errors));
    }

    // Replace req[source] with the parsed (type-safe) data
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
