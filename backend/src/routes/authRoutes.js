const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../validators/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/v1/auth/register
router.post(
  '/register',
  authLimiter,
  registerValidator,
  validate,
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authLimiter,
  loginValidator,
  validate,
  authController.login
);

// GET /api/v1/auth/me — protected
router.get('/me', authenticate, authController.getMe);

module.exports = router;
