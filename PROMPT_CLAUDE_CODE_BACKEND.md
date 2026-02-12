# Claude Code Backend Scaffold Prompt — Day 1-2

> **Copy everything below the line and paste into Claude Code CLI after navigating to the `/backend` directory.**

---

## Context

Read the `CLAUDE.md` file in the project root and `backend/CLAUDE.md` for full architecture context. This is a vacation bungalow booking system for two properties in Thane, Maharashtra, India.

## Pre-flight Check

Before writing any code, verify:
1. Run `node --version` and confirm it's >= 20.0.0
2. Run `pwd` and confirm we're in the `backend/` directory
3. Check that `../CLAUDE.md` and `./CLAUDE.md` exist and read them
4. Check that `../shared/types/` exists with the TypeScript interfaces

If any check fails, stop and tell me what's missing.

## Task: Scaffold the complete Express + MongoDB + TypeScript backend

### Step 1: Initialize the project

Create `package.json` with these dependencies:
- **Runtime**: express, mongoose, cors, helmet, hpp, express-mongo-sanitize, express-rate-limit, express-validator, jsonwebtoken, bcryptjs, razorpay, googleapis, resend, cloudinary, nanoid (v3 for CJS compat), pino, pino-pretty, dotenv, zod, cookie-parser, multer
- **Dev**: typescript, @types/express, @types/cors, @types/bcryptjs, @types/jsonwebtoken, @types/cookie-parser, @types/multer, @types/hpp, ts-node, nodemon, jest, ts-jest, @types/jest, supertest, @types/supertest, mongodb-memory-server
- **Scripts**: `dev` (nodemon), `build` (tsc), `start` (node dist/server.js), `test` (jest --coverage), `seed` (ts-node src/seeds/seed.ts)

Create `tsconfig.json` with strict mode, target ES2022, module commonjs, outDir ./dist, rootDir ./src, paths alias for shared types.

Create `nodemon.json` watching `src/` for `.ts` files, executing `ts-node src/server.ts`.

Create `jest.config.ts` using ts-jest preset with mongodb-memory-server setup file.

### Step 2: Create config layer

Create `src/config/env.ts`:
- Use zod to validate all environment variables at startup
- Export a typed `env` object
- Fail fast with clear error messages if required vars are missing
- Mark Razorpay, Google, Cloudinary, Resend vars as optional (not needed Day 1-2)

Create `src/config/db.ts`:
- MongoDB connection with mongoose
- Retry logic (3 attempts, exponential backoff)
- Event listeners for connected, disconnected, error
- Use pino logger

Create placeholder configs for `razorpay.ts`, `cloudinary.ts`, `resend.ts`, `google-calendar.ts` that export `null` if env vars aren't set (so the app boots without them during Day 1-2).

### Step 3: Create all Mongoose models

Implement every model exactly as specified in `CLAUDE.md`:
- `property.model.ts` — with compound index on slug (unique)
- `booking.model.ts` — with compound index on `{ propertyIds, checkIn, checkOut }`, unique on bookingId, index on status. Use nanoid to auto-generate bookingId with `BK-` prefix on pre-save hook.
- `customer.model.ts` — with index on email and phone
- `payment.model.ts` — with unique index on razorpayOrderId
- `admin-user.model.ts` — with unique index on email. Pre-save hook to hash password with bcrypt 12 rounds. Instance method `comparePassword(candidate)`.
- `damage-report.model.ts`
- `consent-record.model.ts`
- `audit-log.model.ts` — no TTL (retain 1+ year), index on `{ entityType, entityId }`
- `date-hold.model.ts` — TTL index on createdAt (900 seconds), unique compound on `{ propertyId, date }`

All models must use TypeScript interfaces extending `mongoose.Document`. Use `timestamps: true` on all schemas.

### Step 4: Create utilities

- `src/utils/app-error.ts` — Custom AppError class with `statusCode`, `isOperational`, `code` fields
- `src/utils/catch-async.ts` — Higher-order function wrapping async route handlers
- `src/utils/logger.ts` — Pino logger instance (pretty print in dev, JSON in prod)
- `src/utils/constants.ts` — Export enums for BookingStatus, BookingType, PaymentStatus, UserRole. Export RATE_PER_NIGHT = 2500000, SECURITY_DEPOSIT = 500000, HOLD_EXPIRY_SECONDS = 900.

### Step 5: Create middleware

- `src/middleware/auth.middleware.ts` — Verify JWT access token from `Authorization: Bearer <token>` header. Attach `adminId` and `role` to `req`. Export `requireAuth` and `requireRole('owner')`.
- `src/middleware/validate.middleware.ts` — Run express-validator checks, return 400 with formatted errors if validation fails.
- `src/middleware/error-handler.middleware.ts` — Global error handler. In development: return full error. In production: return sanitized message for operational errors, generic "Internal Server Error" for programming errors. Log all errors with pino.
- `src/middleware/rate-limiter.middleware.ts` — Export `loginLimiter` (5 requests per 15 min per IP) and `apiLimiter` (100 requests per 15 min per IP).

### Step 6: Create validators

- `src/validators/booking.validator.ts` — Validate CreateBookingRequest: propertyIds (array of valid ObjectIds), checkIn/checkOut (ISO dates, checkOut > checkIn, checkIn >= today), bookingType, guestCount (>0), customer fields, consent fields.
- `src/validators/payment.validator.ts` — Validate CreateOrderRequest and VerifyPaymentRequest.
- `src/validators/admin-auth.validator.ts` — Validate login (email format, password min 8 chars).
- `src/validators/customer.validator.ts` — Validate DPDP data requests.

### Step 7: Create services (business logic)

- `src/services/availability.service.ts`:
  - `checkAvailability(propertyId, checkIn, checkOut)` → returns array of unavailable dates
  - `createDateHolds(propertyIds, dates, bookingId)` → inserts date holds with unique constraint. Returns success or throws if dates taken.
  - `releaseDateHolds(bookingId)` → deletes holds for a booking (on cancellation)
  - `getMonthAvailability(propertyId, year, month)` → returns all dates in month with available/unavailable status

- `src/services/encryption.service.ts`:
  - `encrypt(plaintext)` → AES-256-GCM encrypted string (iv:authTag:ciphertext format)
  - `decrypt(encrypted)` → plaintext
  - Uses ENCRYPTION_KEY from env

- `src/services/audit.service.ts`:
  - `log(action, entityType, entityId, performedBy, metadata?)` → creates AuditLog entry

- Create stub services for `payment.service.ts`, `calendar.service.ts`, `notification.service.ts` with TODO comments — these will be fully implemented in Days 6-8.

### Step 8: Create controllers

- `src/controllers/property.controller.ts` — `listProperties` (GET, active only), `getProperty` (GET by slug)
- `src/controllers/booking.controller.ts` — `createBooking` (POST, handles both standard + special flow, creates customer, consent record, date holds, and booking in a transaction)
- `src/controllers/payment.controller.ts` — `createOrder` (stub), `verifyPayment` (stub), `handleWebhook` (stub) — mark as TODO for Day 6
- `src/controllers/admin-auth.controller.ts` — `login`, `refreshToken`, `logout` (full implementation with JWT + refresh token rotation)
- `src/controllers/admin-booking.controller.ts` — `listBookings` (paginated, filterable by status/date/property), `getBooking`, `approveBooking`, `rejectBooking`, `checkIn`, `checkOut`
- `src/controllers/admin-dashboard.controller.ts` — `getStats` (total bookings, revenue this month, upcoming bookings count, occupancy rate)
- `src/controllers/admin-blocked-dates.controller.ts` — `listBlockedDates`, `blockDates`, `unblockDate`
- `src/controllers/customer.controller.ts` — `getMyData`, `updateMyData`, `deleteMyData` (DPDP endpoints, stub with TODO)

### Step 9: Create routes

Wire all controllers to Express routers:
- `src/routes/public.routes.ts` — No auth required
- `src/routes/payment.routes.ts` — Webhook route uses `express.raw()` for body
- `src/routes/admin.routes.ts` — All routes behind `requireAuth` middleware
- `src/routes/customer.routes.ts` — Auth via booking token (simplified, not JWT)

### Step 10: Create app.ts and server.ts

`src/app.ts`:
- Apply middleware in order: pino-http logger → helmet → cors (whitelist FRONTEND_URL) → cookie-parser → express.json (limit 10mb) → mongoSanitize → hpp → apiLimiter
- Mount routes: `/api/properties`, `/api/bookings`, `/api/payments`, `/api/admin`, `/api/customer`
- Mount error handler last
- Export app (for testing)

`src/server.ts`:
- Connect to MongoDB
- Start HTTP server on PORT
- Graceful shutdown handler (SIGTERM, SIGINT): close server, disconnect mongoose

### Step 11: Create seed script

`src/seeds/seed.ts`:
- Connect to MongoDB
- Clear existing properties and admin users (dev only)
- Insert 2 properties:
  1. "Bungalow A" (slug: bungalow-a, rate: 2500000, deposit: 500000, maxGuests: 15, amenities: ["Swimming Pool", "Garden", "Parking", "BBQ Area", "WiFi", "AC"])
  2. "Bungalow B" (slug: bungalow-b, rate: 2500000, deposit: 500000, maxGuests: 20, amenities: ["Swimming Pool", "Garden", "Parking", "Party Hall", "WiFi", "AC", "Outdoor Seating"])
- Insert 1 admin user from ADMIN_EMAIL/ADMIN_PASSWORD env vars
- Log results and disconnect

### Step 12: Create test setup and initial tests

`tests/setup.ts`:
- Start MongoMemoryServer before all tests
- Set MONGODB_URI to memory server URI
- Close and clean up after all tests

`tests/services/availability.service.test.ts`:
- Test: available dates return correctly for empty calendar
- Test: creating holds marks dates as unavailable
- Test: overlapping hold creation throws error
- Test: holds for different properties don't conflict
- Test: released holds make dates available again

`tests/controllers/booking.controller.test.ts`:
- Test: successful standard booking creation returns 201 with bookingId
- Test: booking with past check-in date returns 400
- Test: booking with checkOut <= checkIn returns 400
- Test: booking on already-taken dates returns 409

### Step 13: Final verification

After all files are created:
1. Run `npm install` and confirm no errors
2. Copy `.env.example` to `.env` and fill in MONGODB_URI (use a test Atlas cluster or local MongoDB), JWT secrets, and ENCRYPTION_KEY
3. Run `npx tsc --noEmit` and fix any TypeScript errors
4. Run `npm run seed` and confirm 2 properties + 1 admin created
5. Run `npm run dev` and confirm server starts on port 5000
6. Run `npm test` and confirm tests pass
7. Test with curl:
   - `curl http://localhost:5000/api/properties` → should return 2 properties
   - `curl -X POST http://localhost:5000/api/admin/auth/login -H "Content-Type: application/json" -d '{"email":"admin@yourdomain.com","password":"your_password"}'` → should return access token

Report any failures and fix them before finishing.
