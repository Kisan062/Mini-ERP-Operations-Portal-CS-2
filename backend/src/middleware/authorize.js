/**
 * middleware/authorize.js - Role-Based Authorization Middleware
 * Usage: authorize('ADMIN', 'OPERATIONS_USER')
 * Must be used AFTER authenticate middleware
 */

const { ForbiddenError } = require('../errors');

/**
 * Returns middleware that only allows users with one of the specified roles.
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'SALES_USER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
