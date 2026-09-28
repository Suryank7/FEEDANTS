/**
 * Quick smoke test — verifies the full flow works without Jest overhead.
 * Run: node tests/smoke.js
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const Competition = require('../src/models/Competition');
const Participation = require('../src/models/Participation');

async function makeRequest(server, method, path, body = null, token = null) {
  const port = server.address().port;
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
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

async function run() {
  console.log('Starting smoke test...\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));

  let passed = 0;
  let failed = 0;

  function assert(label, condition) {
    if (condition) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.log(`  ❌ ${label}`);
      failed++;
    }
  }

  const now = new Date();
  const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

  // Create test competition
  const comp = await Competition.create({
    title: 'Test Competition',
    slug: 'test-smoke',
    description: 'Smoke test',
    category: 'Test',
    tags: ['Test'],
    organizer: { name: 'Test' },
    prizePool: 1000,
    entryFee: 50,
    currency: 'INR',
    prizes: [{ position: '1st', amount: 1000, currency: 'INR' }],
    registrationStartAt: addDays(now, -2),
    registrationEndAt: addDays(now, 5),
    startAt: addDays(now, 6),
    endAt: addDays(now, 15),
    capacity: 2,
    registeredCount: 0,
    rules: ['Rule 1'],
    eligibility: ['Open to all'],
  });

  // ─── Test 1: GET competition ────────────────────────
  console.log('\n📋 GET /api/v1/competitions/:id');
  const getRes = await makeRequest(server, 'GET', `/api/v1/competitions/${comp._id}`);
  assert('Returns 200', getRes.status === 200);
  assert('Status is REGISTRATION_OPEN', getRes.body.data?.status === 'REGISTRATION_OPEN');
  assert('Remaining slots is 2', getRes.body.data?.remainingSlots === 2);

  // ─── Test 2: Auth register ─────────────────────────
  console.log('\n🔑 POST /api/v1/auth/register');
  const regRes = await makeRequest(server, 'POST', '/api/v1/auth/register', {
    name: 'User A',
    email: 'usera@test.com',
    password: 'password123',
  });
  assert('Registration returns 201', regRes.status === 201);
  assert('Returns token', !!regRes.body.data?.token);
  const tokenA = regRes.body.data?.token;

  // ─── Test 3: Auth login ────────────────────────────
  console.log('\n🔑 POST /api/v1/auth/login');
  const loginRes = await makeRequest(server, 'POST', '/api/v1/auth/login', {
    email: 'usera@test.com',
    password: 'password123',
  });
  assert('Login returns 200', loginRes.status === 200);
  assert('Login returns token', !!loginRes.body.data?.token);

  // ─── Test 4: Competition registration ──────────────
  console.log('\n📝 POST /api/v1/competitions/:id/register');
  const compRegRes = await makeRequest(server, 'POST', `/api/v1/competitions/${comp._id}/register`, null, tokenA);
  assert('Registration returns 201', compRegRes.status === 201);
  assert('Status is REGISTERED', compRegRes.body.data?.status === 'REGISTERED');

  // ─── Test 5: Duplicate registration ─────────────────
  console.log('\n🚫 Duplicate registration');
  const dupRes = await makeRequest(server, 'POST', `/api/v1/competitions/${comp._id}/register`, null, tokenA);
  assert('Duplicate returns 409', dupRes.status === 409);
  assert('Error code is ALREADY_REGISTERED', dupRes.body.error?.code === 'ALREADY_REGISTERED');

  // ─── Test 6: Competition details with auth ──────────
  console.log('\n📋 GET competition with auth');
  const authGetRes = await makeRequest(server, 'GET', `/api/v1/competitions/${comp._id}`, null, tokenA);
  assert('Shows registered=true', authGetRes.body.data?.userParticipation?.registered === true);
  assert('Remaining slots is 1', authGetRes.body.data?.remainingSlots === 1);

  // ─── Test 7: Unauthenticated registration ──────────
  console.log('\n🔒 Unauthenticated registration');
  const unauthRes = await makeRequest(server, 'POST', `/api/v1/competitions/${comp._id}/register`);
  assert('Returns 401', unauthRes.status === 401);

  // ─── Test 8: Register User B ───────────────────────
  console.log('\n📝 Register User B (fill competition)');
  const regB = await makeRequest(server, 'POST', '/api/v1/auth/register', {
    name: 'User B',
    email: 'userb@test.com',
    password: 'password123',
  });
  const tokenB = regB.body.data?.token;
  const compRegB = await makeRequest(server, 'POST', `/api/v1/competitions/${comp._id}/register`, null, tokenB);
  assert('User B registration returns 201', compRegB.status === 201);

  // ─── Test 9: Competition full ──────────────────────
  console.log('\n🚫 Full competition');
  const regC = await makeRequest(server, 'POST', '/api/v1/auth/register', {
    name: 'User C',
    email: 'userc@test.com',
    password: 'password123',
  });
  const tokenC = regC.body.data?.token;
  const fullRes = await makeRequest(server, 'POST', `/api/v1/competitions/${comp._id}/register`, null, tokenC);
  assert('Full competition returns 409', fullRes.status === 409);
  assert('Error code is COMPETITION_FULL', fullRes.body.error?.code === 'COMPETITION_FULL');

  // ─── Test 10: Concurrency test (capacity=1) ─────────
  console.log('\n🔒 CONCURRENCY TEST (capacity=1)');
  const concComp = await Competition.create({
    title: 'Concurrency Test',
    slug: 'concurrency-test',
    description: 'Test',
    category: 'Test',
    tags: [],
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

  // Create 5 users
  const tokens = [];
  for (let i = 0; i < 5; i++) {
    const r = await makeRequest(server, 'POST', '/api/v1/auth/register', {
      name: `Concurrent ${i}`,
      email: `conc${i}@test.com`,
      password: 'password123',
    });
    tokens.push(r.body.data?.token);
  }

  // Fire all 5 simultaneously
  const concResults = await Promise.all(
    tokens.map((t) =>
      makeRequest(server, 'POST', `/api/v1/competitions/${concComp._id}/register`, null, t)
    )
  );

  const successes = concResults.filter((r) => r.status === 201);
  const failures = concResults.filter((r) => r.status !== 201);
  const finalComp = await Competition.findById(concComp._id);
  const participations = await Participation.countDocuments({
    competitionId: concComp._id,
    status: 'REGISTERED',
  });

  assert(`Exactly 1 success (got ${successes.length})`, successes.length === 1);
  assert(`Exactly 4 failures (got ${failures.length})`, failures.length === 4);
  assert(`registeredCount = 1 (got ${finalComp.registeredCount})`, finalComp.registeredCount === 1);
  assert(`Participation records = 1 (got ${participations})`, participations === 1);

  // ─── Summary ────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50) + '\n');

  // Cleanup
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});
