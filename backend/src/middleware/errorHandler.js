/**
 * middleware/errorHandler.js - Centralized Express Error Handler
 * All errors thrown in controllers/services bubble up here
 */

const { AppError } = require('../errors');

const errorHandler = (err, req, res, next) => {
  // Log errors in development (not production secrets)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }

  // Operational errors (our custom AppError subclasses) - safe to expose
  if (err.isOperational) {
    const response = {
      success: false,
      message: err.message,
    };

    // Attach field-level errors for validation failures
    if (err.errors && err.errors.length > 0) {
      response.errors = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ')} already exists`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  // JWT errors (shouldn't normally reach here but as fallback)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // Unexpected errors - hide details in production
  console.error('[UNEXPECTED ERROR]', err);
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
};

module.exports = { errorHandler };
