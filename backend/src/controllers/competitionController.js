const competitionService = require('../services/competitionService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/v1/competitions/:competitionId
 * Returns competition details with computed status and user participation.
 */
async function getCompetition(req, res, next) {
  try {
    const { competitionId } = req.params;
    const userId = req.user ? req.user._id : null;

    const data = await competitionService.getCompetitionDetails(competitionId, userId);

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/competitions/:competitionId/register
 * Registers the authenticated user for a competition.
 */
async function registerForCompetition(req, res, next) {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    const data = await competitionService.registerForCompetition(competitionId, userId);

    return sendSuccess(
      res,
      data,
      'Successfully registered for the competition',
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/competitions/:competitionId/register
 * Cancels the user's registration. Only allowed before competition starts.
 */
async function cancelRegistration(req, res, next) {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    const data = await competitionService.cancelRegistration(competitionId, userId);

    return sendSuccess(res, data, 'Registration cancelled successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/competitions/:competitionId/participation
 * Returns user's participation status for a specific competition.
 */
async function getParticipation(req, res, next) {
  try {
    const { competitionId } = req.params;
    const userId = req.user._id;

    const data = await competitionService.getParticipationStatus(competitionId, userId);

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCompetition,
  registerForCompetition,
  cancelRegistration,
  getParticipation,
};
