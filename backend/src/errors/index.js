/**
 * errors/index.js - Custom error classes for the Mini ERP application
 * These allow the centralized error handler to respond with correct HTTP status codes
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks expected business errors vs unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 404 - Resource not found */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/** 400 - Input validation failed */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/** 401 - Not authenticated */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/** 403 - Authenticated but not permitted */
class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/** 400 - Not enough inventory to fulfill request */
class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient available inventory') {
    super(message, 400);
    this.name = 'InsufficientStockError';
  }
}

/** 409 - Duplicate operation detected (e.g. receiving an already-received transfer) */
class DuplicateOperationError extends AppError {
  constructor(message = 'This operation has already been performed') {
    super(message, 409);
    this.name = 'DuplicateOperationError';
  }
}

/** 409 - Conflict in state (e.g. wrong status transition) */
class ConflictError extends AppError {
  constructor(message = 'Operation not allowed in current state') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  InsufficientStockError,
  DuplicateOperationError,
  ConflictError,
};
