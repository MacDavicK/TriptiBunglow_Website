# CLAUDE.md — Thane Bungalow Booking System

## Project Overview
Web-based booking system for two vacation bungalows in Thane, Maharashtra.
- **Rate**: ₹25,000/night per bungalow (stored as 2500000 paise)
- **Security deposit**: ₹5,000 per booking (stored as 500000 paise)
- **Single transaction**: Customer pays ₹30,000 total. Deposit refunded post-checkout.
- **Primary admin**: Non-technical father. Uses Google Calendar + WhatsApp for daily operations.
- **Customers**: Scan QR code → land on booking website → book + pay online.

## Tech Stack
- **Monorepo**: npm workspaces (`/backend`, `/frontend`, `/shared`)
- **Backend**: Node.js 20+, Express 4, TypeScript, Mongoose 8
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS 3
- **Database**: MongoDB Atlas M0 (free, Mumbai region `ap-south-1`)
- **Payments**: Razorpay Standard Checkout (INR only)
- **Calendar**: Google Calendar API (service account, one-way sync)
- **Email**: Resend (3,000/month free)
- **WhatsApp**: wa.me deep links (Phase 1), MSG91 (Phase 2)
- **Images**: Cloudinary (free 25GB tier)
- **Hosting**: Railway (backend $5/mo), Render Static (frontend free)

## Architecture Constraints
- All monetary values in **paise** (integer). Never use floats for money.
- All dates in **UTC ISO 8601**. Convert to IST (Asia/Kolkata) only in frontend display layer.
- Booking availability = all-day model (check-in 2PM, check-out 11AM, but system books full calendar days).
- Two bungalows: `bungalow-a` and `bungalow-b` (slugs). Weddings/parties can book both.
- **bookingType**: `standard` (instant book, single bungalow) | `special` (manual approval, weddings/parties/dual-bungalow)

## MongoDB Collections & Schemas

### properties
```
{ name, slug, ratePerNight (paise), securityDeposit (paise), amenities[], photos[], maxGuests, description, isActive }
```

### bookings
```
{ bookingId (nanoid), propertyIds[] (ref→properties), customerId (ref→customers),
  checkIn (Date), checkOut (Date), nights (Number),
  bookingType: enum[standard, special],
  status: enum[hold, pending_approval, confirmed, checked_in, checked_out, cancelled, refunded],
  razorpayOrderId, razorpayPaymentId,
  totalCharged (paise), depositAmount (paise), depositRefundAmount (paise),
  damageReportId (ref→damageReports), googleCalendarEventId,
  consentRecordId (ref→consentRecords),
  specialRequests (String), guestCount (Number),
  createdAt, updatedAt }
```
**Indexes**: Compound `{ propertyIds: 1, checkIn: 1, checkOut: 1 }`, unique on `bookingId`, index on `status`

### customers
```
{ name, email, phone, nationality: enum[indian, foreign],
  idType: enum[aadhaar, passport, driving_license, voter_id],
  idNumber (AES-256-GCM encrypted), idDocumentUrl (Cloudinary),
  dataRetentionExpiresAt (Date),
  createdAt, updatedAt }
```

### payments
```
{ razorpayOrderId (unique), razorpayPaymentId, bookingId (ref→bookings),
  amount (paise), currency: 'INR', status: enum[created, authorized, captured, failed, refunded],
  refunds: [{ refundId, amount, reason, createdAt }],
  webhookEvents: [{ event, payload, receivedAt }],
  createdAt, updatedAt }
```

### adminUsers
```
{ email (unique), passwordHash (bcrypt 12 rounds), name,
  role: enum[owner, manager],
  refreshTokens: [{ token (hashed), expiresAt, createdAt }],
  createdAt, updatedAt }
```

### damageReports
```
{ bookingId (ref→bookings), photos[] (Cloudinary URLs),
  description, estimatedDamage (paise), deductionAmount (paise),
  status: enum[reported, deducted, disputed, resolved],
  createdAt, updatedAt }
```

### consentRecords
```
{ customerId (ref→customers), consentVersion (String),
  purposesConsented: [String], consentText (String),
  ipAddress, userAgent,
  consentGivenAt (Date), isActive (Boolean) }
```

### auditLog
```
{ action (String), entityType (String), entityId (ObjectId),
  performedBy (ref→adminUsers | 'system' | 'customer'),
  metadata (Mixed), ipAddress,
  createdAt }
```
**TTL index**: None on auditLog (retain minimum 1 year per DPDP Rules). Use cron job for cleanup.

### dateHolds (for double-booking prevention)
```
{ propertyId (ref→properties), date (Date), bookingId (ref→bookings),
  createdAt }
```
**TTL index**: `createdAt` expires after 900 seconds (15 minutes). Unique compound index on `{ propertyId, date }`.

## API Endpoints (Express Router structure)

### Public
- `GET  /api/properties` — List active properties
- `GET  /api/properties/:slug` — Property detail
- `GET  /api/availability?propertyId=&month=&year=` — Available dates
- `POST /api/bookings` — Create booking (standard = instant, special = pending_approval)
- `POST /api/payments/create-order` — Create Razorpay order
- `POST /api/payments/verify` — Verify Razorpay signature (HMAC-SHA256)
- `POST /api/payments/webhook` — Razorpay webhook handler (raw body, signature verification)
- `GET  /api/privacy-policy` — DPDP privacy policy content

### Customer (authenticated via booking token)
- `GET    /api/customer/my-data` — DPDP data export
- `PATCH  /api/customer/my-data` — DPDP data correction
- `DELETE /api/customer/my-data` — DPDP erasure request

### Admin (JWT protected)
- `POST /api/admin/auth/login` — Login (returns access + refresh tokens)
- `POST /api/admin/auth/refresh` — Refresh access token
- `POST /api/admin/auth/logout` — Revoke refresh token
- `GET  /api/admin/bookings` — List bookings (filterable, paginated)
- `GET  /api/admin/bookings/:id` — Booking detail
- `PATCH /api/admin/bookings/:id/approve` — Approve special booking
- `PATCH /api/admin/bookings/:id/reject` — Reject special booking
- `PATCH /api/admin/bookings/:id/check-in` — Mark checked in
- `PATCH /api/admin/bookings/:id/check-out` — Mark checked out + trigger deposit refund
- `POST /api/admin/bookings/:id/damage-report` — Create damage report
- `POST /api/admin/bookings/:id/refund` — Process deposit refund (full or partial)
- `GET  /api/admin/blocked-dates` — List blocked dates
- `POST /api/admin/blocked-dates` — Block date(s)
- `DELETE /api/admin/blocked-dates/:id` — Unblock date
- `GET  /api/admin/dashboard/stats` — Summary stats (occupancy, revenue, upcoming)

## Payment Flow (Razorpay)

### Standard Booking (instant)
1. Frontend: POST /api/payments/create-order `{ bookingId, amount: 3000000 }`
2. Backend: `razorpay.orders.create({ amount, currency: 'INR', receipt: bookingId })`
3. Frontend: Open Razorpay Checkout modal with `order_id`
4. Customer pays → Razorpay returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
5. Frontend: POST /api/payments/verify with all three values
6. Backend: Verify HMAC-SHA256 signature using `key_secret`
7. On success: Update booking status → `confirmed`, create Google Calendar event, send email + WhatsApp
8. Webhook backup: `payment.captured` event confirms payment even if frontend verification fails

### Special Booking (manual approval)
1. Customer submits special request → booking created with status `pending_approval`
2. Admin receives WhatsApp notification (wa.me link)
3. Admin approves → backend generates Razorpay Payment Link (48-hour expiry)
4. Payment link sent to customer via email
5. Customer pays via link → webhook triggers confirmation flow

### Deposit Refund
- Full: `razorpay.payments.refund(paymentId, { amount: 500000 })`
- Partial (damage): `razorpay.payments.refund(paymentId, { amount: 500000 - deductionAmount })`
- Process time: 5-7 business days

## Security Requirements
- **Auth**: JWT access tokens (15min, in-memory) + refresh tokens (7d, HttpOnly/Secure/SameSite=Strict cookie)
- **Passwords**: bcrypt 12 rounds
- **Rate limiting**: 5 login attempts per 15min per IP (express-rate-limit)
- **Middleware stack order**: helmet → cors → mongoSanitize → hpp → express-validator
- **NoSQL injection**: express-mongo-sanitize + Mongoose schema enforcement + `mongoose.set('sanitizeFilter', true)`
- **CORS**: Whitelist only frontend domain
- **Razorpay webhook**: Verify `x-razorpay-signature` header with HMAC-SHA256 before processing
- **ID encryption**: AES-256-GCM for idNumber field (encrypt on save, decrypt on read for authorized admin only)
- **Environment variables**: NEVER expose Razorpay key_secret, Google service account JSON, or any secrets to frontend

## DPDP Act 2023 Compliance
- Itemized consent notice with non-pre-ticked checkbox before collecting personal data
- Store ConsentRecord with exact text version, timestamp, IP, user agent
- Data minimization: only name, email, phone, ID (if foreign guest), payment info
- ID required for foreign guests (Foreigners Act Form C); optional for Indian guests
- Data retention: 3 years customers, 5 years bookings, 7 years payments, 1 year audit logs
- User rights endpoints: export, correction, erasure (with legal retention exceptions)
- Privacy policy in English (Phase 1), add Hindi (Phase 2)

## Coding Conventions
- **File naming**: kebab-case for files (`booking-controller.ts`), PascalCase for React components
- **Exports**: Named exports only. No default exports.
- **Error handling**: Custom `AppError` class extending Error with `statusCode` and `isOperational` fields
- **Validation**: express-validator for all request bodies. Validate before controller logic.
- **Response format**: `{ success: boolean, data?: T, error?: { message, code } }`
- **Logging**: Use `pino` logger. Structured JSON logs. Never log PII.
- **Tests**: Jest + Supertest. Co-locate test files (`*.test.ts`). Minimum 80% coverage for controllers.
- **Git**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Shared Types Location
All TypeScript interfaces for API request/response contracts live in `/shared/types/`.
Both backend and frontend reference these. Keep them in sync.

## Commands Reference
```bash
# Root
npm install              # Install all workspaces
npm run dev              # Start both backend + frontend
npm run dev:backend      # Backend only (port 5000)
npm run dev:frontend     # Frontend only (port 5173)
npm run test             # Run backend tests

# Backend
cd backend
npm run dev              # nodemon + ts-node
npm run test             # jest --coverage
npm run seed             # Seed properties + admin user

# Frontend
cd frontend
npm run dev              # vite dev server
npm run build            # production build
npm run preview          # preview production build
```
