# Backend CLAUDE.md — Express + MongoDB + TypeScript

## Directory Structure (target)
```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                  # MongoDB connection with retry
│   │   ├── env.ts                 # Validated environment variables (zod)
│   │   ├── razorpay.ts            # Razorpay instance
│   │   ├── cloudinary.ts          # Cloudinary config
│   │   ├── resend.ts              # Resend email client
│   │   └── google-calendar.ts     # Google Calendar service
│   ├── models/
│   │   ├── property.model.ts
│   │   ├── booking.model.ts
│   │   ├── customer.model.ts
│   │   ├── payment.model.ts
│   │   ├── admin-user.model.ts
│   │   ├── damage-report.model.ts
│   │   ├── consent-record.model.ts
│   │   ├── audit-log.model.ts
│   │   └── date-hold.model.ts
│   ├── routes/
│   │   ├── public.routes.ts       # Properties, availability, booking creation
│   │   ├── payment.routes.ts      # Razorpay order, verify, webhook
│   │   ├── customer.routes.ts     # DPDP data rights
│   │   └── admin.routes.ts        # Dashboard, booking management, auth
│   ├── controllers/
│   │   ├── property.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── admin-auth.controller.ts
│   │   ├── admin-booking.controller.ts
│   │   ├── admin-dashboard.controller.ts
│   │   └── admin-blocked-dates.controller.ts
│   ├── services/
│   │   ├── availability.service.ts    # Date overlap logic, hold management
│   │   ├── payment.service.ts         # Razorpay order, verify, refund
│   │   ├── calendar.service.ts        # Google Calendar CRUD
│   │   ├── notification.service.ts    # Email (Resend) + WhatsApp (wa.me links)
│   │   ├── encryption.service.ts      # AES-256-GCM for ID numbers
│   │   └── audit.service.ts           # Audit log writer
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT verification
│   │   ├── validate.middleware.ts     # express-validator runner
│   │   ├── error-handler.middleware.ts
│   │   └── rate-limiter.middleware.ts
│   ├── validators/
│   │   ├── booking.validator.ts
│   │   ├── payment.validator.ts
│   │   ├── admin-auth.validator.ts
│   │   └── customer.validator.ts
│   ├── utils/
│   │   ├── app-error.ts              # Custom error class
│   │   ├── catch-async.ts            # Async error wrapper
│   │   ├── logger.ts                 # Pino logger
│   │   └── constants.ts              # Enums, rate values, deposit amount
│   ├── seeds/
│   │   └── seed.ts                   # Seed 2 properties + 1 admin user
│   └── app.ts                        # Express app setup (middleware, routes)
│   └── server.ts                     # HTTP server + MongoDB connect + graceful shutdown
├── tests/
│   ├── setup.ts                      # MongoDB Memory Server setup
│   ├── controllers/
│   │   ├── booking.controller.test.ts
│   │   └── payment.controller.test.ts
│   └── services/
│       └── availability.service.test.ts
├── package.json
├── tsconfig.json
├── jest.config.ts
├── nodemon.json
└── .env.example
```

## Key Implementation Notes

### MongoDB Connection (config/db.ts)
- Use `mongoose.connect()` with `serverSelectionTimeoutMS: 5000`
- Retry connection 3 times with exponential backoff
- Log connection events: connected, disconnected, error

### Availability Logic (services/availability.service.ts)
- To check availability: query dateHolds collection for `{ propertyId, date: { $in: requestedDates } }`
- A date is unavailable if a dateHold exists with a non-expired TTL OR a confirmed booking covers it
- To create a hold: insert individual dateHold docs for each date. If duplicate key error → date taken.
- Hold expires in 15 minutes (TTL index). On payment success, convert holds to permanent by updating the associated booking to `confirmed`.

### Payment Signature Verification
```typescript
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');
if (expectedSignature !== signature) throw new AppError('Invalid payment signature', 400);
```

### Webhook Handler
- Parse raw body (NOT JSON-parsed): use `express.raw({ type: 'application/json' })` on webhook route
- Verify `x-razorpay-signature` header
- Process `payment.captured` and `payment.failed` events
- Idempotency: check if payment already processed before updating booking

### JWT Token Strategy
- Access token: `{ adminId, role }`, signed with `JWT_ACCESS_SECRET`, 15min expiry
- Refresh token: random 64-byte hex, hashed with SHA-256 before storing in DB
- On refresh: rotate token (delete old, create new). Return new access + set new refresh cookie.
- On logout: delete specific refresh token from DB

### Environment Variables Required
See `.env.example` in this directory. Day 1-2 only needs:
- `MONGODB_URI` (Atlas connection string)
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (generate random 64-char strings)
- `ENCRYPTION_KEY` (32-byte hex for AES-256-GCM)

Razorpay, Google Calendar, Cloudinary, Resend keys needed by Day 6.

## Do NOT
- Never use `any` type. Use `unknown` + type guards if needed.
- Never log customer PII (email, phone, ID numbers).
- Never return stack traces in production error responses.
- Never use `findById` with unsanitized user input — always validate ObjectId format first.
- Never store refresh tokens in plaintext — always hash with SHA-256.
