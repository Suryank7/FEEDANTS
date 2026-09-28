const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Participation = require('../models/Participation');
const { getCompetitionStatus, COMPETITION_STATUS } = require('../utils/competitionStatus');
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require('../utils/errors');

/**
 * Get competition details with computed status and user participation state.
 *
 * @param {string}      competitionId - MongoDB ObjectId string
 * @param {string|null} userId        - Authenticated user's ID, or null
 * @returns {object} Formatted competition data
 */
async function getCompetitionDetails(competitionId, userId = null) {
  const competition = await Competition.findById(competitionId);

  if (!competition) {
    throw new NotFoundError('Competition not found');
  }

  const now = new Date();

  const status = getCompetitionStatus({
    now,
    registrationStartAt: competition.registrationStartAt,
    registrationEndAt: competition.registrationEndAt,
    startAt: competition.startAt,
    endAt: competition.endAt,
    capacity: competition.capacity,
    registeredCount: competition.registeredCount,
  });

  // Check user's participation if authenticated
  let userParticipation = { registered: false, participationId: null, status: null };

  if (userId) {
    const participation = await Participation.findOne({
      competitionId: competition._id,
      userId,
      status: { $ne: 'CANCELLED' },
    });

    if (participation) {
      userParticipation = {
        registered: true,
        participationId: participation._id,
        status: participation.status,
        registeredAt: participation.registeredAt,
      };
    }
  }

  return formatCompetitionResponse(competition, status, userParticipation);
}

/**
 * Register a user for a competition.
 * Uses atomic findOneAndUpdate with $lt guard to prevent over-registration.
 *
 * CONCURRENCY STRATEGY:
 * 1. Validate competition exists and registration is open (time-based).
 * 2. Check for duplicate participation (compound unique index is the final safeguard).
 * 3. Atomically increment registeredCount ONLY if registeredCount < capacity.
 *    - This is a single atomic MongoDB operation — no race condition window.
 * 4. If the atomic increment succeeds, create the Participation record.
 * 5. If participation creation fails (e.g., duplicate key), rollback the counter.
 *
 * This approach avoids full transactions (which require replica sets) and instead
 * uses MongoDB's atomic update guarantees on single documents.
 *
 * @param {string} competitionId
 * @param {string} userId
 * @returns {object} Registration result
 */
async function registerForCompetition(competitionId, userId) {
  // Step 1: Fetch competition
  const competition = await Competition.findById(competitionId);

  if (!competition) {
    throw new NotFoundError('Competition not found');
  }

  // Step 2: Validate competition state allows registration
  const now = new Date();
  const status = getCompetitionStatus({
    now,
    registrationStartAt: competition.registrationStartAt,
    registrationEndAt: competition.registrationEndAt,
    startAt: competition.startAt,
    endAt: competition.endAt,
    capacity: competition.capacity,
    registeredCount: competition.registeredCount,
  });

  switch (status) {
    case COMPETITION_STATUS.UPCOMING:
      throw new ConflictError(
        'Registration has not started yet',
        'REGISTRATION_NOT_STARTED'
      );
    case COMPETITION_STATUS.REGISTRATION_CLOSED:
      throw new ConflictError(
        'Registration deadline has passed',
        'REGISTRATION_CLOSED'
      );
    case COMPETITION_STATUS.FULL:
      throw new ConflictError(
        'No participation spots are available',
        'COMPETITION_FULL'
      );
    case COMPETITION_STATUS.LIVE:
      throw new ConflictError(
        'Competition is already live. Registration is closed.',
        'COMPETITION_LIVE'
      );
    case COMPETITION_STATUS.ENDED:
      throw new ConflictError(
        'Competition has ended',
        'COMPETITION_ENDED'
      );
    case COMPETITION_STATUS.REGISTRATION_OPEN:
      // Allowed — continue
      break;
    default:
      throw new ConflictError(
        'Registration is not available at this time',
        'REGISTRATION_UNAVAILABLE'
      );
  }

  // Step 3: Check for existing participation (early check — index is ultimate safeguard)
  const existingParticipation = await Participation.findOne({
    competitionId: competition._id,
    userId,
    status: { $ne: 'CANCELLED' },
  });

  if (existingParticipation) {
    throw new ConflictError(
      'You are already registered for this competition',
      'ALREADY_REGISTERED'
    );
  }

  // Step 4: ATOMIC capacity reservation
  // This is the critical concurrency-safe operation.
  // findOneAndUpdate atomically checks (registeredCount < capacity) AND increments.
  // If two requests arrive simultaneously, only one will succeed when remaining = 1.
  const updatedCompetition = await Competition.findOneAndUpdate(
    {
      _id: competition._id,
      registeredCount: { $lt: competition.capacity },
    },
    {
      $inc: { registeredCount: 1 },
    },
    { returnDocument: 'after' }
  );

  if (!updatedCompetition) {
    throw new ConflictError(
      'No participation spots are available',
      'COMPETITION_FULL'
    );
  }

  // Step 5: Create participation record
  let participation;
  try {
    participation = await Participation.create({
      competitionId: competition._id,
      userId,
      status: 'REGISTERED',
      registeredAt: now,
    });
  } catch (error) {
    // Rollback the counter if participation creation fails
    // (e.g., duplicate key from compound index race condition)
    await Competition.findByIdAndUpdate(competition._id, {
      $inc: { registeredCount: -1 },
    });

    if (error.code === 11000) {
      throw new ConflictError(
        'You are already registered for this competition',
        'ALREADY_REGISTERED'
      );
    }

    throw error;
  }

  return {
    competitionId: competition._id,
    participationId: participation._id,
    status: participation.status,
    registeredAt: participation.registeredAt,
    remainingSlots: updatedCompetition.capacity - updatedCompetition.registeredCount,
  };
}

/**
 * Cancel a user's registration for a competition.
 * Only allowed before the competition starts.
 *
 * @param {string} competitionId
 * @param {string} userId
 * @returns {object} Cancellation result
 */
async function cancelRegistration(competitionId, userId) {
  const competition = await Competition.findById(competitionId);

  if (!competition) {
    throw new NotFoundError('Competition not found');
  }

  const now = new Date();

  // Only allow cancellation before competition starts
  if (now >= competition.startAt) {
    throw new ConflictError(
      'Cannot cancel registration after competition has started',
      'CANCELLATION_NOT_ALLOWED'
    );
  }

  const participation = await Participation.findOne({
    competitionId: competition._id,
    userId,
    status: 'REGISTERED',
  });

  if (!participation) {
    throw new NotFoundError('No active registration found');
  }

  // Update participation status
  participation.status = 'CANCELLED';
  await participation.save();

  // Decrement registered count atomically
  await Competition.findByIdAndUpdate(competition._id, {
    $inc: { registeredCount: -1 },
  });

  return {
    competitionId: competition._id,
    participationId: participation._id,
    status: 'CANCELLED',
  };
}

/**
 * Get user's participation status for a competition.
 *
 * @param {string} competitionId
 * @param {string} userId
 * @returns {object} Participation status
 */
async function getParticipationStatus(competitionId, userId) {
  const competition = await Competition.findById(competitionId);

  if (!competition) {
    throw new NotFoundError('Competition not found');
  }

  const participation = await Participation.findOne({
    competitionId: competition._id,
    userId,
    status: { $ne: 'CANCELLED' },
  });

  if (!participation) {
    return { registered: false };
  }

  return {
    registered: true,
    participationId: participation._id,
    status: participation.status,
    registeredAt: participation.registeredAt,
  };
}

/**
 * Format competition data for API response.
 * Strips internal fields and adds computed properties.
 */
function formatCompetitionResponse(competition, status, userParticipation) {
  const comp = competition.toJSON();

  return {
    id: comp.id,
    title: comp.title,
    slug: comp.slug,
    description: comp.description,
    bannerImage: comp.bannerImage,
    category: comp.category,
    tags: comp.tags,
    organizer: comp.organizer,
    prizePool: comp.prizePool,
    entryFee: comp.entryFee,
    currency: comp.currency,
    prizes: comp.prizes,
    registrationStartAt: comp.registrationStartAt,
    registrationEndAt: comp.registrationEndAt,
    submissionStartAt: comp.submissionStartAt,
    submissionEndAt: comp.submissionEndAt,
    startAt: comp.startAt,
    endAt: comp.endAt,
    resultAt: comp.resultAt,
    capacity: comp.capacity,
    registeredCount: comp.registeredCount,
    remainingSlots: comp.capacity - comp.registeredCount,
    status,
    rules: comp.rules,
    eligibility: comp.eligibility,
    judgingParameters: comp.judgingParameters,
    previousWinners: comp.previousWinners,
    certificateProvided: comp.certificateProvided,
    disclaimer: comp.disclaimer,
    referralEnabled: comp.referralEnabled,
    userParticipation,
    createdAt: comp.createdAt,
    updatedAt: comp.updatedAt,
  };
}

module.exports = {
  getCompetitionDetails,
  registerForCompetition,
  cancelRegistration,
  getParticipationStatus,
};
