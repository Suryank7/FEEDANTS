const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware that checks express-validator results.
 * Returns 422 with all validation messages on failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return sendError(
      res,
      'VALIDATION_ERROR',
      messages.join('. '),
      422
    );
  }
  next();
};

module.exports = validate;
