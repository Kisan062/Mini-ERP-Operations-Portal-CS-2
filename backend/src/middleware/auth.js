/**
 * middleware/auth.js - JWT Authentication Middleware
 * Verifies the Bearer token on every protected route
 */

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors');
const { prisma } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired. Please login again.');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }

    // 3. Load user from database (ensures account still active)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // 4. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
