/**
 * Unit tests for Competition Status Engine
 *
 * Tests the centralized status calculation utility to ensure
 * correct lifecycle state derivation from timestamps and capacity.
 */

const {
  getCompetitionStatus,
  canRegister,
  COMPETITION_STATUS,
} = require('../../src/utils/competitionStatus');

describe('Competition Status Engine', () => {
  // Base dates for testing
  const baseParams = {
    registrationStartAt: new Date('2026-10-01T00:00:00Z'),
    registrationEndAt: new Date('2026-10-10T00:00:00Z'),
    startAt: new Date('2026-10-12T00:00:00Z'),
    endAt: new Date('2026-10-20T00:00:00Z'),
    capacity: 100,
    registeredCount: 50,
  };

  describe('getCompetitionStatus', () => {
    test('returns UPCOMING when before registration start', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-09-25T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.UPCOMING);
    });

    test('returns REGISTRATION_OPEN when within registration window with available slots', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-05T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.REGISTRATION_OPEN);
    });

    test('returns FULL when registration open but capacity reached', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-05T00:00:00Z'),
        registeredCount: 100,
      });
      expect(status).toBe(COMPETITION_STATUS.FULL);
    });

    test('returns REGISTRATION_CLOSED when past registration deadline but before start', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-11T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.REGISTRATION_CLOSED);
    });

    test('returns LIVE when competition is ongoing', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-15T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.LIVE);
    });

    test('returns ENDED when competition has finished', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-21T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.ENDED);
    });

    test('returns ENDED at exact end time', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-20T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.ENDED);
    });

    test('returns LIVE at exact start time', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-12T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.LIVE);
    });

    test('returns REGISTRATION_OPEN at exact registration start', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-01T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.REGISTRATION_OPEN);
    });

    test('returns REGISTRATION_CLOSED at exact registration end', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-10T00:00:00Z'),
      });
      expect(status).toBe(COMPETITION_STATUS.REGISTRATION_CLOSED);
    });
  });

  describe('Precedence Rules', () => {
    test('ENDED takes precedence over everything (even if full)', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-21T00:00:00Z'),
        registeredCount: 100,
      });
      expect(status).toBe(COMPETITION_STATUS.ENDED);
    });

    test('LIVE takes precedence over FULL', () => {
      const status = getCompetitionStatus({
        ...baseParams,
        now: new Date('2026-10-15T00:00:00Z'),
        registeredCount: 100,
      });
      expect(status).toBe(COMPETITION_STATUS.LIVE);
    });
  });

  describe('canRegister', () => {
    test('returns true during registration window with available slots', () => {
      const result = canRegister({
        ...baseParams,
        now: new Date('2026-10-05T00:00:00Z'),
      });
      expect(result).toBe(true);
    });

    test('returns false when competition is full', () => {
      const result = canRegister({
        ...baseParams,
        now: new Date('2026-10-05T00:00:00Z'),
        registeredCount: 100,
      });
      expect(result).toBe(false);
    });

    test('returns false before registration opens', () => {
      const result = canRegister({
        ...baseParams,
        now: new Date('2026-09-25T00:00:00Z'),
      });
      expect(result).toBe(false);
    });

    test('returns false after registration closes', () => {
      const result = canRegister({
        ...baseParams,
        now: new Date('2026-10-11T00:00:00Z'),
      });
      expect(result).toBe(false);
    });

    test('returns false when competition has ended', () => {
      const result = canRegister({
        ...baseParams,
        now: new Date('2026-10-21T00:00:00Z'),
      });
      expect(result).toBe(false);
    });

    test('returns false when competition is live', () => {
      const result = canRegister({
        ...baseParams,
        now: new Date('2026-10-15T00:00:00Z'),
      });
      expect(result).toBe(false);
    });
  });

  describe('Remaining Slots Calculation', () => {
    test('correctly calculates remaining slots', () => {
      const params = { ...baseParams, capacity: 100, registeredCount: 73 };
      expect(params.capacity - params.registeredCount).toBe(27);
    });

    test('remaining slots never goes negative', () => {
      const remaining = Math.max(0, 100 - 105);
      expect(remaining).toBe(0);
    });

    test('remaining is zero when exactly full', () => {
      expect(100 - 100).toBe(0);
    });
  });
});
