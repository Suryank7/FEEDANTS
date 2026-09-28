/**
 * Concurrency Tests — Registration Race Condition
 *
 * CRITICAL TEST: Verifies that the atomic registration mechanism
 * prevents over-registration when multiple users attempt to register
 * simultaneously for a competition with limited capacity.
 *
 * Test scenario:
 * - Competition with capacity = 10
 * - 20 simultaneous registration attempts
 * - Expected: exactly 10 succeed, exactly 10 fail
 * - registeredCount must never exceed capacity
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');

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

describe('Concurrent Registration — Race Condition Prevention', () => {
  test('capacity=10, 20 simultaneous requests → exactly 10 succeed', async () => {
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    // Create competition with capacity 10
    const comp = await Competition.create({
      title: 'Concurrency Test Competition',
      slug: 'concurrency-test',
      description: 'Testing concurrent registration',
      category: 'Test',
      tags: ['Test'],
      organizer: { name: 'Test' },
      prizePool: 0,
      entryFee: 0,
      currency: 'INR',
      prizes: [],
      registrationStartAt: addDays(now, -2),
      registrationEndAt: addDays(now, 5),
      startAt: addDays(now, 6),
      endAt: addDays(now, 15),
      capacity: 10,
      registeredCount: 0,
      rules: [],
      eligibility: [],
    });

    // Create 20 users and get their tokens
    const userPromises = [];
    for (let i = 0; i < 20; i++) {
      userPromises.push(
        request.post('/api/v1/auth/register').send({
          name: `User ${i}`,
          email: `user${i}@concurrent.com`,
          password: 'password123',
        })
      );
    }
    const userResponses = await Promise.all(userPromises);
    const tokens = userResponses.map((r) => r.body.data.token);

    // Fire all 20 registration requests SIMULTANEOUSLY
    const registrationPromises = tokens.map((token) =>
      request
        .post(`/api/v1/competitions/${comp._id}/register`)
        .set('Authorization', `Bearer ${token}`)
    );

    const results = await Promise.all(registrationPromises);

    // Count successes and failures
    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status !== 201);

    console.log(`\n🔒 Concurrency Test Results:`);
    console.log(`   Successful registrations: ${successes.length}`);
    console.log(`   Failed registrations: ${failures.length}`);

    // CRITICAL ASSERTION: exactly 10 succeed
    expect(successes.length).toBe(10);
    expect(failures.length).toBe(10);

    // Verify database consistency
    const finalComp = await Competition.findById(comp._id);
    expect(finalComp.registeredCount).toBe(10);
    expect(finalComp.registeredCount).toBeLessThanOrEqual(finalComp.capacity);

    // Verify participation count matches
    const participations = await Participation.countDocuments({
      competitionId: comp._id,
      status: 'REGISTERED',
    });
    expect(participations).toBe(10);

    console.log(`   Final registeredCount: ${finalComp.registeredCount}`);
    console.log(`   Final participations: ${participations}`);
    console.log(`   ✅ No over-registration!\n`);
  });

  test('capacity=1, 2 simultaneous requests → exactly 1 succeeds', async () => {
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

    const comp = await Competition.create({
      title: 'Single Slot Test',
      slug: 'single-slot-test',
      description: 'Testing single slot concurrency',
      category: 'Test',
      tags: ['Test'],
      organizer: { name: 'Test' },
      prizePool: 0,
      entryFee: 0,
      currency: 'INR',
      prizes: [],
      registrationStartAt: addDays(now, -2),
      registrationEndAt: addDays(now, 5),
      startAt: addDays(now, 6),
      endAt: addDays(now, 15),
      capacity: 1,
      registeredCount: 0,
      rules: [],
      eligibility: [],
    });

    // Create 2 users
    const res1 = await request.post('/api/v1/auth/register').send({
      name: 'User A',
      email: 'usera@test.com',
      password: 'password123',
    });
    const res2 = await request.post('/api/v1/auth/register').send({
      name: 'User B',
      email: 'userb@test.com',
      password: 'password123',
    });

    const tokenA = res1.body.data.token;
    const tokenB = res2.body.data.token;

    // Fire both registrations simultaneously
    const [resultA, resultB] = await Promise.all([
      request
        .post(`/api/v1/competitions/${comp._id}/register`)
        .set('Authorization', `Bearer ${tokenA}`),
      request
        .post(`/api/v1/competitions/${comp._id}/register`)
        .set('Authorization', `Bearer ${tokenB}`),
    ]);

    const allResults = [resultA, resultB];
    const successes = allResults.filter((r) => r.status === 201);
    const failures = allResults.filter((r) => r.status !== 201);

    console.log(`\n🔒 Single-Slot Concurrency Test:`);
    console.log(`   Successful: ${successes.length}`);
    console.log(`   Failed: ${failures.length}`);

    // CRITICAL: Exactly one registration succeeds
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify database state
    const finalComp = await Competition.findById(comp._id);
    expect(finalComp.registeredCount).toBe(1);

    const participations = await Participation.countDocuments({
      competitionId: comp._id,
      status: 'REGISTERED',
    });
    expect(participations).toBe(1);

    console.log(`   ✅ Exactly one registration succeeded!\n`);
  });
});
