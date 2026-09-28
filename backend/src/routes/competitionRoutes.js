const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const { competitionIdValidator } = require('../validators/competitionValidator');
const validate = require('../validators/validate');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { registrationLimiter } = require('../middleware/rateLimiter');
const Competition = require('../models/Competition');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/v1/competitions/first — convenience endpoint for frontend auto-discovery
router.get('/first', async (req, res) => {
  try {
    const comp = await Competition.findOne().sort({ createdAt: 1 });
    if (!comp) {
      return sendError(res, 'NOT_FOUND', 'No competitions found', 404);
    }
    return sendSuccess(res, { id: comp._id });
  } catch (err) {
    return sendError(res, 'INTERNAL_ERROR', 'Failed to fetch competition', 500);
  }
});

// GET /api/v1/competitions/:competitionId
// Uses optionalAuth so logged-in users see their participation state
router.get(
  '/:competitionId',
  competitionIdValidator,
  validate,
  optionalAuth,
  competitionController.getCompetition
);

// POST /api/v1/competitions/:competitionId/register — protected
router.post(
  '/:competitionId/register',
  registrationLimiter,
  competitionIdValidator,
  validate,
  authenticate,
  competitionController.registerForCompetition
);

// DELETE /api/v1/competitions/:competitionId/register — protected
router.delete(
  '/:competitionId/register',
  competitionIdValidator,
  validate,
  authenticate,
  competitionController.cancelRegistration
);

// GET /api/v1/competitions/:competitionId/participation — protected
router.get(
  '/:competitionId/participation',
  competitionIdValidator,
  validate,
  authenticate,
  competitionController.getParticipation
);

module.exports = router;
