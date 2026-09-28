const morgan = require('morgan');

/**
 * Custom request logger.
 * Adds request timing and structured output.
 * In production, this could be replaced with Winston or Pino.
 */
const requestLogger = morgan(
  ':method :url :status :response-time ms - :res[content-length]',
  {
    skip: (req) => {
      // Skip health-check and test environment in logs
      return process.env.NODE_ENV === 'test' || req.url === '/health';
    },
  }
);

module.exports = requestLogger;
