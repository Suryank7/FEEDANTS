/**
 * Integration Tests — Competition API
 *
 * Uses mongodb-memory-server for isolated, ephemeral testing.
 * Tests cover: fetching competitions, registration flow, edge cases.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');

// Set env vars before requiring app
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const app = require('../../src/app');
const User = require('../../src/models/User');
const Competition = require('../../src/models/Competition');
const Participation = require('../../src/models/Participation');

const http = require('http');

let mongoServer;
let server;
let request;

// Helper to create a user and get JWT
async function createUserAndLogin(name = 'Test User', email = 'test@test.com') {
  const res = await request.post('/api/v1/auth/register').send({
    name,
    email,
    password: 'password123',
  });
  return res.body.data.token;
}

// Helper to create a competition in various states
function createCompetitionData(overrides = {}) {
  const now = new Date();
  const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

  return {
    title: 'Test Competition',
    slug: `test-comp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: 'A test competition',
    category: 'Test',
    tags: ['Test'],
    organizer: { name: 'Test Organizer' },
    prizePool: 1000,
    entryFee: 50,
    currency: 'INR',
    prizes: [{ position: '1st', amount: 1000, currency: 'INR' }],
    registrationStartAt: addDays(now, -2),
    registrationEndAt: addDays(now, 5),
    startAt: addDays(now, 6),
    endAt: addDays(now, 15),
    capacity: 100,
    registeredCount: 0,
    rules: ['Rule 1'],
    eligibility: ['Open to all'],
    ...overrides,
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    driverInfo: { name: 'nodejs', version: process.version },
  });
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  request = supertest(server);
}, 120000);

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Competition.deleteMany({});
  await Participation.deleteMany({});
});

// ─── GET Competition Details ────────────────────────────

describe('GET /api/v1/competitions/:competitionId', () => {
  test('returns competition details with computed status', async () => {
    const comp = await Competition.create(createCompetitionData());

    const res = await request.get(`/api/v1/competitions/${comp._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(comp._id.toString());
    expect(res.body.data.title).toBe('Test Competition');
    expect(res.body.data.status).toBe('REGISTRATION_OPEN');
    expect(res.body.data.remainingSlots).toBe(100);
    expect(res.body.data.userParticipation.registered).toBe(false);
  });

  test('returns 404 for non-existent competition', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request.get(`/api/v1/competitions/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('returns 422 for invalid competition ID format', async () => {
    const res = await request.get('/api/v1/competitions/invalid-id');

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  test('includes user participation when authenticated', async () => {
    const token = await createUserAndLogin('Auth User', 'auth@test.com');
    const comp = await Competition.create(createCompetitionData());

    const res = await request
      .get(`/api/v1/competitions/${comp._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userParticipation).toBeDefined();
    expect(res.body.data.userParticipation.registered).toBe(false);
  });

  test('shows UPCOMING status for future competition', async () => {
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    const comp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, 5),
        registrationEndAt: addDays(now, 15),
        startAt: addDays(now, 16),
        endAt: addDays(now, 25),
      })
    );

    const res = await request.get(`/api/v1/competitions/${comp._id}`);
    expect(res.body.data.status).toBe('UPCOMING');
  });

  test('shows ENDED status for past competition', async () => {
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    const comp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, -30),
        registrationEndAt: addDays(now, -20),
        startAt: addDays(now, -19),
        endAt: addDays(now, -5),
      })
    );

    const res = await request.get(`/api/v1/competitions/${comp._id}`);
    expect(res.body.data.status).toBe('ENDED');
  });
});

// ─── POST Registration ──────────────────────────────────

describe('POST /api/v1/competitions/:competitionId/register', () => {
  test('successfully registers authenticated user', async () => {
    const token = await createUserAndLogin('Reg User', 'reg@test.com');
    const comp = await Competition.create(createCompetitionData());

    const res = await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REGISTERED');
    expect(res.body.data.competitionId).toBe(comp._id.toString());

    // Verify registeredCount was incremented
    const updated = await Competition.findById(comp._id);
    expect(updated.registeredCount).toBe(1);
  });

  test('returns 401 for unauthenticated request', async () => {
    const comp = await Competition.create(createCompetitionData());

    const res = await request.post(`/api/v1/competitions/${comp._id}/register`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('prevents duplicate registration', async () => {
    const token = await createUserAndLogin('Dup User', 'dup@test.com');
    const comp = await Competition.create(createCompetitionData());

    // First registration
    await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    // Duplicate registration
    const res = await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_REGISTERED');
  });

  test('rejects registration for full competition', async () => {
    const token = await createUserAndLogin('Full User', 'full@test.com');
    const comp = await Competition.create(
      createCompetitionData({ capacity: 5, registeredCount: 5 })
    );

    const res = await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('COMPETITION_FULL');
  });

  test('rejects registration before registration opens', async () => {
    const token = await createUserAndLogin('Early User', 'early@test.com');
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    const comp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, 5),
        registrationEndAt: addDays(now, 15),
        startAt: addDays(now, 16),
        endAt: addDays(now, 25),
      })
    );

    const res = await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REGISTRATION_NOT_STARTED');
  });

  test('rejects registration after deadline', async () => {
    const token = await createUserAndLogin('Late User', 'late@test.com');
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    const comp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, -10),
        registrationEndAt: addDays(now, -2),
        startAt: addDays(now, 1),
        endAt: addDays(now, 10),
      })
    );

    const res = await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
  });

  test('rejects registration for ended competition', async () => {
    const token = await createUserAndLogin('End User', 'end@test.com');
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    const comp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, -30),
        registrationEndAt: addDays(now, -20),
        startAt: addDays(now, -19),
        endAt: addDays(now, -5),
      })
    );

    const res = await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('COMPETITION_ENDED');
  });

  test('returns 404 for non-existent competition', async () => {
    const token = await createUserAndLogin('Ghost User', 'ghost@test.com');
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request
      .post(`/api/v1/competitions/${fakeId}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE Registration ─────────────────────────────────

describe('DELETE /api/v1/competitions/:competitionId/register', () => {
  test('successfully cancels registration', async () => {
    const token = await createUserAndLogin('Cancel User', 'cancel@test.com');
    const comp = await Competition.create(createCompetitionData());

    // Register first
    await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    // Cancel
    const res = await request
      .delete(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');

    // Verify count decremented
    const updated = await Competition.findById(comp._id);
    expect(updated.registeredCount).toBe(0);
  });
});

// ─── GET Participation Status ────────────────────────────

describe('GET /api/v1/competitions/:competitionId/participation', () => {
  test('returns registered status for registered user', async () => {
    const token = await createUserAndLogin('Part User', 'part@test.com');
    const comp = await Competition.create(createCompetitionData());

    // Register
    await request
      .post(`/api/v1/competitions/${comp._id}/register`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get(`/api/v1/competitions/${comp._id}/participation`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.registered).toBe(true);
    expect(res.body.data.status).toBe('REGISTERED');
  });

  test('returns not registered for new user', async () => {
    const token = await createUserAndLogin('New User', 'new@test.com');
    const comp = await Competition.create(createCompetitionData());

    const res = await request
      .get(`/api/v1/competitions/${comp._id}/participation`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.registered).toBe(false);
  });
});
