const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Authentication middleware — verifies JWT from Authorization header.
 * Attaches the authenticated user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token expired'));
    }
    next(error);
  }
};

/**
 * Optional auth — attempts to authenticate but doesn't fail if no token.
 * Used for endpoints that return personalized data when logged in.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    req.user = user || null;
    next();
  } catch {
    // Token invalid/expired — continue without auth
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };
