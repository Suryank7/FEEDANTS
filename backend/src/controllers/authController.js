const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });

    return sendSuccess(
      res,
      result,
      'Account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res, next) {
  try {
    return sendSuccess(res, { user: req.user.toJSON() });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe };
