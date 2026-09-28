/**
 * Standardized API response helpers.
 * Consistent envelope format across all endpoints.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object}  data      - Response payload
 * @param {string}  [message] - Optional message
 * @param {number}  [status]  - HTTP status code (default 200)
 */
function sendSuccess(res, data, message = null, status = 200) {
  const response = { success: true };
  if (message) response.message = message;
  response.data = data;
  return res.status(status).json(response);
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code     - Machine-readable error code
 * @param {string} message  - Human-readable message
 * @param {number} [status] - HTTP status (default 400)
 */
function sendError(res, code, message, status = 400) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

module.exports = { sendSuccess, sendError };
