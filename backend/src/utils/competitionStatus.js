/**
 * Competition Status Engine
 *
 * Centralized status calculation — single source of truth.
 * Status is derived from timestamps and capacity, never stored as a static field.
 *
 * Precedence (highest to lowest):
 *   ENDED > LIVE > REGISTRATION_CLOSED > FULL > REGISTRATION_OPEN > UPCOMING > DRAFT
 */

const COMPETITION_STATUS = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  FULL: 'FULL',
  LIVE: 'LIVE',
  ENDED: 'ENDED',
};

/**
 * Compute the current competition status from authoritative fields.
 *
 * @param {Object} params
 * @param {Date}   params.now                  - Current time (UTC)
 * @param {Date}   params.registrationStartAt  - Registration window opens
 * @param {Date}   params.registrationEndAt    - Registration window closes
 * @param {Date}   params.startAt              - Competition starts
 * @param {Date}   params.endAt                - Competition ends
 * @param {number} params.capacity             - Total slots
 * @param {number} params.registeredCount      - Currently registered
 * @returns {string} One of COMPETITION_STATUS values
 */
function getCompetitionStatus({
  now,
  registrationStartAt,
  registrationEndAt,
  startAt,
  endAt,
  capacity,
  registeredCount,
}) {
  const currentTime = new Date(now);
  const regStart = new Date(registrationStartAt);
  const regEnd = new Date(registrationEndAt);
  const compStart = new Date(startAt);
  const compEnd = new Date(endAt);

  // 1. Competition ended — highest precedence
  if (currentTime >= compEnd) {
    return COMPETITION_STATUS.ENDED;
  }

  // 2. Competition is live
  if (currentTime >= compStart && currentTime < compEnd) {
    return COMPETITION_STATUS.LIVE;
  }

  // 3. Registration closed (deadline passed, but competition hasn't started)
  if (currentTime >= regEnd && currentTime < compStart) {
    return COMPETITION_STATUS.REGISTRATION_CLOSED;
  }

  // 4. Registration open window
  if (currentTime >= regStart && currentTime < regEnd) {
    // 4a. Full — registration is open but no slots left
    if (registeredCount >= capacity) {
      return COMPETITION_STATUS.FULL;
    }
    return COMPETITION_STATUS.REGISTRATION_OPEN;
  }

  // 5. Before registration opens
  if (currentTime < regStart) {
    return COMPETITION_STATUS.UPCOMING;
  }

  return COMPETITION_STATUS.DRAFT;
}

/**
 * Determine if registration is currently allowed.
 */
function canRegister({
  now,
  registrationStartAt,
  registrationEndAt,
  startAt,
  endAt,
  capacity,
  registeredCount,
}) {
  const status = getCompetitionStatus({
    now,
    registrationStartAt,
    registrationEndAt,
    startAt,
    endAt,
    capacity,
    registeredCount,
  });

  return status === COMPETITION_STATUS.REGISTRATION_OPEN;
}

module.exports = {
  COMPETITION_STATUS,
  getCompetitionStatus,
  canRegister,
};
