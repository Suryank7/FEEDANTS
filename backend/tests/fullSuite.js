/**
 * Comprehensive Backend Test Suite
 *
 * Runs all integration, lifecycle, edge case, and concurrency race-condition tests
 * directly in native Node.js with MongoMemoryServer for maximum speed and reliability.
 *
 * Usage: node tests/fullSuite.js
 */

process.env.JWT_SECRET = 'test-secret-key-for-full-suite';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');
const Participation = require('../src/models/Participation');

let server;
let baseUrl;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const now = new Date();
const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

function createCompetitionData(overrides = {}) {
  return {
    title: 'Feedants Classical Dance Test',
    slug: `test-dance-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: 'Online classical dance competition test',
    category: 'Dance',
    tags: ['Dance', 'Multi-Win'],
    organizer: {
      name: 'Manju Dubey',
      title: 'Professional Kathak Dancer',
      experience: '12+ Years of Experience',
    },
    prizePool: 1500,
    entryFee: 99,
    currency: 'INR',
    prizes: [
      { position: '1st Winner', amount: 550, currency: 'INR' },
      { position: '2nd Winner', amount: 300, currency: 'INR' },
      { position: '3rd Winner', amount: 240, currency: 'INR' },
    ],
    registrationStartAt: addDays(now, -2),
    registrationEndAt: addDays(now, 5),
    startAt: addDays(now, 6),
    endAt: addDays(now, 15),
    capacity: 20,
    registeredCount: 0,
    rules: ['Solo performance only.', 'Traditional attire required.'],
    eligibility: ['Open to all age groups.'],
    ...overrides,
  };
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FEEDANTS BACKEND FULL INTEGRATION & CONCURRENCY TEST SUITE   ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(label, condition, detail = '') {
    if (condition) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.log(`  ❌ ${label} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════
    console.log('📌 1. Authentication & JWT');

    const regUser1 = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Priya Sharma',
      email: 'priya@test.com',
      password: 'securePassword123',
    });
    assert('POST /auth/register returns 201 Created', regUser1.status === 201);
    assert('Registration response contains JWT token', !!regUser1.body.data?.token);
    assert('Registration response contains user details (no password)', !regUser1.body.data?.user?.passwordHash);
    const token1 = regUser1.body.data?.token;

    const dupEmail = await makeRequest('POST', '/api/v1/auth/register', {
      name: 'Priya Clone',
      email: 'priya@test.com',
      password: 'securePassword123',
    });
    assert('Duplicate email registration returns 409 Conflict', dupEmail.status === 409);
    assert('Duplicate email returns EMAIL_EXISTS error code', dupEmail.body.error?.code === 'EMAIL_EXISTS');

    const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'priya@test.com',
      password: 'securePassword123',
    });
    assert('POST /auth/login returns 200 OK', loginRes.status === 200);
    assert('Login response returns valid JWT', !!loginRes.body.data?.token);

    const badLogin = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'priya@test.com',
      password: 'wrongPassword',
    });
    assert('Invalid credentials returns 401 Unauthorized', badLogin.status === 401);

    const meRes = await makeRequest('GET', '/api/v1/auth/me', null, token1);
    assert('GET /auth/me returns current user info', meRes.status === 200 && meRes.body.data?.user?.email === 'priya@test.com');

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: COMPETITION DETAILS & LIFECYCLE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📌 2. Competition Details & Dynamic Lifecycle States');

    const openComp = await Competition.create(createCompetitionData());
    const getRes = await makeRequest('GET', `/api/v1/competitions/${openComp._id}`);
    assert('GET /competitions/:id returns 200', getRes.status === 200);
    assert('Computed status is REGISTRATION_OPEN', getRes.body.data?.status === 'REGISTRATION_OPEN');
    assert('Remaining slots matches capacity', getRes.body.data?.remainingSlots === 20);
    assert('Unauthenticated userParticipation.registered is false', getRes.body.data?.userParticipation?.registered === false);

    const notFoundRes = await makeRequest('GET', `/api/v1/competitions/${new mongoose.Types.ObjectId()}`);
    assert('Non-existent ID returns 404 NOT_FOUND', notFoundRes.status === 404);

    const invalidIdRes = await makeRequest('GET', '/api/v1/competitions/invalid-mongo-id');
    assert('Invalid ObjectId format returns 422 Unprocessable Entity', invalidIdRes.status === 422);

    // Lifecycle: UPCOMING
    const upcomingComp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, 5),
        registrationEndAt: addDays(now, 15),
        startAt: addDays(now, 16),
        endAt: addDays(now, 25),
      })
    );
    const upRes = await makeRequest('GET', `/api/v1/competitions/${upcomingComp._id}`);
    assert('Future competition computes status UPCOMING', upRes.body.data?.status === 'UPCOMING');

    // Lifecycle: ENDED
    const endedComp = await Competition.create(
      createCompetitionData({
        registrationStartAt: addDays(now, -30),
        registrationEndAt: addDays(now, -20),
        startAt: addDays(now, -19),
        endAt: addDays(now, -5),
      })
    );
    const endRes = await makeRequest('GET', `/api/v1/competitions/${endedComp._id}`);
    assert('Past competition computes status ENDED', endRes.body.data?.status === 'ENDED');

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: REGISTRATION FLOW & EDGE CASES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📌 3. Registration Flow & Guard Conditions');

    // Unauthenticated registration attempt
    const unauthReg = await makeRequest('POST', `/api/v1/competitions/${openComp._id}/register`);
    assert('Unauthenticated registration returns 401 UNAUTHORIZED', unauthReg.status === 401);

    // Successful registration
    const regRes = await makeRequest('POST', `/api/v1/competitions/${openComp._id}/register`, null, token1);
    assert('Authenticated registration returns 201 Created', regRes.status === 201);
    assert('Registration response status is REGISTERED', regRes.body.data?.status === 'REGISTERED');

    // Verify DB count incremented
    const updatedComp = await Competition.findById(openComp._id);
    assert('Competition registeredCount incremented to 1', updatedComp.registeredCount === 1);

    // Verify GET with auth shows registered
    const authGetRes = await makeRequest('GET', `/api/v1/competitions/${openComp._id}`, null, token1);
    assert('GET with auth reflects registered: true', authGetRes.body.data?.userParticipation?.registered === true);
    assert('GET reflects remainingSlots decremented to 19', authGetRes.body.data?.remainingSlots === 19);

    // Duplicate registration attempt
    const dupReg = await makeRequest('POST', `/api/v1/competitions/${openComp._id}/register`, null, token1);
    assert('Duplicate registration returns 409 ALREADY_REGISTERED', dupReg.status === 409 && dupReg.body.error?.code === 'ALREADY_REGISTERED');

    // Register before window opens
    const earlyReg = await makeRequest('POST', `/api/v1/competitions/${upcomingComp._id}/register`, null, token1);
    assert('Registration before start date returns 409 REGISTRATION_NOT_STARTED', earlyReg.status === 409 && earlyReg.body.error?.code === 'REGISTRATION_NOT_STARTED');

    // Register for ended competition
    const lateReg = await makeRequest('POST', `/api/v1/competitions/${endedComp._id}/register`, null, token1);
    assert('Registration for ended competition returns 409 COMPETITION_ENDED', lateReg.status === 409 && lateReg.body.error?.code === 'COMPETITION_ENDED');

    // Registration cancellation
    const cancelRes = await makeRequest('DELETE', `/api/v1/competitions/${openComp._id}/register`, null, token1);
    assert('DELETE registration returns 200 OK', cancelRes.status === 200);
    const postCancelComp = await Competition.findById(openComp._id);
    assert('Cancellation decrements registeredCount back to 0', postCancelComp.registeredCount === 0);

    // ═══════════════════════════════════════════════════════════════
    // SECTION 4: CONCURRENCY RACE CONDITION PROTECTION
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📌 4. Concurrency Protection (Race Condition Stress Test)');

    // Test scenario: capacity = 10, 20 concurrent requests
    const concComp10 = await Competition.create(
      createCompetitionData({
        capacity: 10,
        registeredCount: 0,
      })
    );

    // Create 20 unique users
    const userTokens = [];
    for (let i = 0; i < 20; i++) {
      const u = await makeRequest('POST', '/api/v1/auth/register', {
        name: `Concurrent User ${i}`,
        email: `concurrent_${i}@test.com`,
        password: 'password123',
      });
      userTokens.push(u.body.data?.token);
    }

    // Fire 20 SIMULTANEOUS registration requests
    const raceResults = await Promise.all(
      userTokens.map((token) =>
        makeRequest('POST', `/api/v1/competitions/${concComp10._id}/register`, null, token)
      )
    );

    const successes = raceResults.filter((r) => r.status === 201);
    const rejected = raceResults.filter((r) => r.status === 409);
    const finalComp10 = await Competition.findById(concComp10._id);
    const totalParticipations = await Participation.countDocuments({
      competitionId: concComp10._id,
      status: 'REGISTERED',
    });

    assert(`Exactly 10 of 20 concurrent requests succeeded (got ${successes.length})`, successes.length === 10);
    assert(`Exactly 10 of 20 concurrent requests were rejected (got ${rejected.length})`, rejected.length === 10);
    assert(`Database registeredCount is exactly 10 (never exceeded capacity)`, finalComp10.registeredCount === 10);
    assert(`Database Participation records count is exactly 10`, totalParticipations === 10);

    // Test scenario 2: capacity = 1, 5 concurrent requests
    const concComp1 = await Competition.create(
      createCompetitionData({
        capacity: 1,
        registeredCount: 0,
      })
    );

    const raceResults1 = await Promise.all(
      userTokens.slice(0, 5).map((token) =>
        makeRequest('POST', `/api/v1/competitions/${concComp1._id}/register`, null, token)
      )
    );

    const successes1 = raceResults1.filter((r) => r.status === 201);
    const rejected1 = raceResults1.filter((r) => r.status === 409);
    const finalComp1 = await Competition.findById(concComp1._id);

    assert(`Single-slot competition: exactly 1 succeeded (got ${successes1.length})`, successes1.length === 1);
    assert(`Single-slot competition: exactly 4 rejected (got ${rejected1.length})`, rejected1.length === 4);
    assert(`Single-slot competition: registeredCount is exactly 1`, finalComp1.registeredCount === 1);

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error running full test suite:', err);
  process.exit(1);
});
