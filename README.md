# Feedants — Competition Details Module

## Full Stack Development Internship Technical Assignment

A **production-oriented, full-stack competition module** built with React Native, Node.js/Express.js, and MongoDB.

All competition data is dynamically driven by backend APIs — nothing is hardcoded in the frontend.

---

## 🏗️ Architecture

```
┌──────────────────────────┐
│   React Native (Expo)    │  ← Presentation Layer
│   Competition Details    │
│   Screen + Components    │
├──────────────────────────┤
│         HTTPS            │
│       REST API           │
├──────────────────────────┤
│  Node.js + Express.js    │  ← Business Logic Layer
│  Routes → Controllers    │
│  → Services → Models     │
├──────────────────────────┤
│       Mongoose           │
├──────────────────────────┤
│        MongoDB           │  ← Data Layer
│  users, competitions,    │
│  participations          │
└──────────────────────────┘
```

---

## ✨ Features

### Frontend
- Competition details screen matching Feedants design
- Live countdown timer (updates every second)
- 10 distinct UI states: Loading, Loaded, Upcoming, Active, Registered, Full, Closed, Ended, Error, Network Failure
- Pull-to-refresh
- Login/Register bottom sheet
- Skeleton loading placeholders
- Double-click registration protection
- Pessimistic UI (waits for server confirmation)

### Backend
- RESTful API (`/api/v1`)
- JWT authentication (required auth + optional auth)
- Atomic registration with concurrency protection
- Competition lifecycle status engine
- Input validation (express-validator)
- Centralized error handling
- Rate limiting (general + registration + auth)
- Security headers (Helmet)
- CORS configuration
- Structured request logging

### Database
- Separate collections: `users`, `competitions`, `participations`
- Compound unique index `{ competitionId, userId }` prevents duplicate registrations
- `remainingSlots` derived from `capacity - registeredCount` (never stored independently)
- Proper indexes for query patterns

---

## 📁 Folder Structure

```
feedants-assignment/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── controllers/    # Request/response handlers
│   │   ├── middleware/      # Auth, error handler, rate limiter, logger
│   │   ├── models/          # Mongoose schemas (User, Competition, Participation)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Competition status engine, API response helpers, error classes
│   │   ├── validators/      # Express-validator chains
│   │   ├── app.js           # Express app configuration
│   │   └── server.js        # Entry point
│   ├── seeds/               # Development seed data
│   ├── tests/
│   │   ├── unit/            # Competition status calculation tests
│   │   ├── integration/     # API endpoint tests
│   │   └── concurrency/     # Race condition prevention tests
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── config/          # API base URL configuration
│   │   ├── constants/       # Color palette, design tokens
│   │   ├── context/         # Auth context provider
│   │   ├── hooks/           # useCompetition custom hook
│   │   ├── screens/         # CompetitionDetailsScreen, LoginScreen
│   │   ├── services/        # API service layer
│   │   └── utils/           # Date utilities
│   ├── App.js               # Entry point
│   └── package.json
│
├── README.md
├── .gitignore
└── .env.example
```

---

## 🚀 Environment Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI (`npx expo`)
- Android Studio / Xcode (for emulator) or Expo Go (for physical device)

### 1. Clone & Install

```bash
git clone <repo-url>
cd feedants-assignment

# Backend
cd backend
npm install
cp .env.example .env   # Edit .env with your MongoDB URI

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/feedants
JWT_SECRET=your-secret-key-change-me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:8081
NODE_ENV=development
```

### 3. Database Setup

Start MongoDB locally or connect to MongoDB Atlas. Then seed:

```bash
cd backend
npm run seed
```

This creates:
| # | Competition | State |
|---|-------------|-------|
| 1 | Classical Dance | Registration Open |
| 2 | Photography Challenge | Upcoming |
| 3 | Singing Star | Full (capacity reached) |
| 4 | Art Exhibition | Live |
| 5 | Poetry Slam | Ended |
| 6 | Speed Challenge | Capacity=1 (concurrency testing) |

Test users created: `test@example.com`, `demo@example.com` (password: `password123`)

### 4. Running the Project

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npx expo start
```

Then press `a` for Android emulator, `i` for iOS simulator, or scan QR with Expo Go.

**Important:** For physical devices, update `frontend/src/config/api.js` with your machine's local IP address.

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt-token>
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Create account |
| `POST` | `/auth/login` | No | Login |
| `GET` | `/auth/me` | Yes | Current user |
| `GET` | `/competitions/:id` | Optional | Competition details |
| `GET` | `/competitions/first` | No | First competition ID |
| `POST` | `/competitions/:id/register` | Yes | Register for competition |
| `DELETE` | `/competitions/:id/register` | Yes | Cancel registration |
| `GET` | `/competitions/:id/participation` | Yes | Participation status |

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Successful retrieval |
| 201 | Registration created |
| 400 | Invalid request |
| 401 | Unauthenticated |
| 404 | Not found |
| 409 | Conflict (full, duplicate, closed) |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `COMPETITION_FULL` | No spots remaining |
| `ALREADY_REGISTERED` | User already registered |
| `REGISTRATION_NOT_STARTED` | Registration not yet open |
| `REGISTRATION_CLOSED` | Registration deadline passed |
| `COMPETITION_ENDED` | Competition has ended |
| `COMPETITION_LIVE` | Competition already started |

---

## 📋 Business Rules

### Competition Lifecycle

```
UPCOMING → REGISTRATION_OPEN → REGISTRATION_CLOSED → LIVE → ENDED
                                      ↑
                                    FULL
                              (if capacity reached)
```

### Status Precedence (highest → lowest)
```
ENDED > LIVE > REGISTRATION_CLOSED > FULL > REGISTRATION_OPEN > UPCOMING
```

### Registration Rules
1. User must be authenticated
2. Registration window must be open (`registrationStartAt` ≤ now < `registrationEndAt`)
3. Competition must not be full (`registeredCount < capacity`)
4. User must not already be registered
5. Competition must not have ended

### Cancellation Rules
- Allowed only before competition starts
- Decrements `registeredCount` atomically
- Frees the slot for other users

---

## 🔒 Concurrency Strategy

**Problem:** Two users simultaneously registering for the last slot could cause over-registration.

**Solution: Atomic `findOneAndUpdate` with `$lt` guard.**

```javascript
Competition.findOneAndUpdate(
  {
    _id: competitionId,
    registeredCount: { $lt: capacity }  // Atomic guard
  },
  {
    $inc: { registeredCount: 1 }        // Atomic increment
  }
)
```

**How it works:**
1. MongoDB executes the query + update as a single atomic operation
2. If `registeredCount` equals `capacity`, the `$lt` condition fails → update returns `null`
3. Only ONE request can successfully increment when `remaining = 1`
4. If the subsequent `Participation.create()` fails (e.g., duplicate key), the counter is rolled back

**Why not full transactions?**
MongoDB transactions require replica sets. For a technical assignment, the atomic update approach provides identical concurrency guarantees without infrastructure requirements.

**Verified by test:**
- `capacity=10`, 20 simultaneous requests → exactly 10 succeed
- `capacity=1`, 2 simultaneous requests → exactly 1 succeeds

---

## 🧪 Testing

```bash
cd backend

# Unit tests (competition status engine — 21 tests)
npm run test:unit

# Full test suite (integration + auth + lifecycle + concurrency race condition — 35 tests)
npm run test:full

# Quick smoke test (fast verification — 21 tests)
npm run test:smoke

# All test suites (unit + full suite)
npm test
```

### Test Coverage

| Suite | Tests | What's Covered |
|-------|-------|----------------|
| Unit | 21 | Status calculation, precedence, remaining slots |
| Integration | 15+ | All endpoints, auth, validation, edge cases |
| Concurrency | 2 | capacity=10/20 requests, capacity=1/2 requests |

### Edge Cases Tested
1. Invalid competition ID
2. Competition does not exist
3. Registration before opening
4. Registration after closing
5. Competition already ended
6. Competition full
7. User already registered
8. Unauthenticated request
9. Simultaneous registrations (race condition)
10. Registration cancellation

---

## ⚖️ Technical Decisions

### Why MongoDB?
- Document flexibility for varied competition schemas
- Atomic update operators (`$inc`, `$lt`) for concurrency
- Fast development iteration
- Natural fit for JSON API responses

### Why Separate Participation Collection?
- Prevents unbounded array growth in Competition documents
- Enables compound unique index `{competitionId, userId}`
- Better query performance for user-specific lookups
- Scalable to millions of participations

### Why Backend-Derived Competition Status?
- Single source of truth — no client/server state drift
- Prevents stale UI from making invalid registrations
- Status computed from timestamps + capacity at query time

### Why REST APIs?
- Simple, well-understood by evaluators
- Clean separation between client and server
- Easy to test with standard tools (curl, Postman, supertest)

### Why Pessimistic UI for Registration?
- Registration is a critical operation with side effects
- Optimistic UI could mislead users about slot availability
- Server confirmation ensures data consistency

---

## ⚠️ Assumptions

1. A single MongoDB instance (no replica set) — using atomic operations instead of transactions
2. UTC for all stored timestamps; display conversion happens on the frontend
3. Entry fee payment is out of scope (UI shows fee but no payment flow)
4. One registration per user per competition (enforced by compound unique index)
5. Cancellation re-opens the slot immediately
6. The frontend auto-discovers the first competition — in production, this would use navigation params

---

## 🔄 Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Atomic update vs. transactions | Simpler setup, but rollback is manual (counter decrement on failure) |
| In-memory rate limiting | Resets on server restart; production would use Redis |
| JWT in AsyncStorage | Sufficient for assignment; production would use secure storage |
| Single screen app | Focused scope; production would have navigation stack |
| Emoji icons | Consistent across platforms; production would use vector icons |

---

## 🚀 Future Improvements

- **Multiple Competitions List** — browsable competition feed
- **Navigation Stack** — React Navigation with deep linking
- **Push Notifications** — registration confirmations, countdown alerts
- **Admin Dashboard** — competition CRUD, analytics
- **Leaderboard** — per-competition rankings
- **Search & Filtering** — by category, status, date
- **Payment Integration** — Razorpay/Stripe for entry fees
- **File Upload** — submission handling (S3/Cloudinary)
- **Redis Caching** — competition details cache
- **WebSocket** — real-time slot updates
- **i18n** — Hindi/English language support
- **CI/CD** — automated testing and deployment
- **Docker Compose** — containerized development environment
- **Monitoring** — APM, error tracking (Sentry)
- **Waitlist** — queue system when competition is full

---

## 👤 Test Accounts

| Email | Password | Notes |
|-------|----------|-------|
| test@example.com | password123 | Pre-seeded test user |
| demo@example.com | password123 | Pre-seeded demo user |
| riya@example.com | password123 | Registered for Classical Dance |

---

## 📜 License

This project was built as part of the Feedants Full Stack Development Internship Technical Assignment.
