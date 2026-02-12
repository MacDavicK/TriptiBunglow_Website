# Tripti Bungalow — Vacation Rental Booking System

A full-stack booking platform for two premium vacation bungalows in Thane, Maharashtra. Built to replace manual WhatsApp/phone coordination with a self-service system that handles availability, payments, and guest management — while staying compliant with India's Digital Personal Data Protection (DPDP) Act 2023.

## The Problem

Two bungalows (₹25,000/night + ₹5,000 refundable security deposit) are currently booked through phone calls and WhatsApp messages. This leads to double-bookings, lost leads, manual payment tracking, and zero audit trail. There's no centralized calendar, no automated confirmations, and deposit refunds are tracked in spreadsheets.

## What This System Does

**For Guests:**
- Browse property details, photos, and amenities
- Check real-time availability via an interactive calendar
- Book instantly (standard) or submit special requests (events, extended stays)
- Pay securely via Razorpay (UPI, cards, net banking)
- Receive booking confirmations via email and WhatsApp
- Exercise data rights (export, correct, delete) under DPDP Act

**For Property Owners (Admin Dashboard):**
- View all bookings with filters (status, date range, property)
- Approve or reject special booking requests
- Manage blocked dates (maintenance, personal use)
- Process check-in/check-out with deposit tracking
- File damage reports with photo evidence and partial deposit deductions
- Issue full or partial refunds
- Dashboard with occupancy stats and revenue overview

**Automated:**
- Google Calendar sync — confirmed bookings create calendar events automatically
- 15-minute date holds prevent double-booking during checkout
- Webhook-based payment confirmation (no reliance on frontend callback alone)
- Audit logging for all admin actions
- Data retention policies with automatic expiry tracking

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, React Router v7, TanStack Query v5 |
| **Backend** | Node.js 20+, Express 4, TypeScript, Mongoose 8 |
| **Database** | MongoDB Atlas (M0 free tier, Mumbai region) |
| **Payments** | Razorpay (standard checkout + payment links for special bookings) |
| **Calendar** | Google Calendar API (service account) |
| **Email** | Resend |
| **Notifications** | WhatsApp Business API |
| **Images** | Cloudinary |
| **Hosting** | Railway (backend), Render Static (frontend) |

## Project Structure

```
├── backend/                # Express API server
│   └── src/
│       ├── config/         # DB, env validation, third-party clients
│       ├── controllers/    # Route handlers
│       ├── middleware/      # Auth, validation, error handling, rate limiting
│       ├── models/         # Mongoose schemas (9 collections)
│       ├── routes/         # Public, admin, customer, payment routes
│       ├── seeds/          # Property + admin seed data
│       ├── services/       # Business logic (availability, encryption, payments)
│       ├── utils/          # AppError, logger, constants
│       └── validators/     # Request body validation (express-validator)
├── frontend/               # React SPA
│   └── src/
│       ├── components/     # UI primitives + layout + booking components
│       ├── contexts/       # Auth context (token-in-memory pattern)
│       ├── hooks/          # React Query hooks, Razorpay integration
│       ├── pages/          # Public pages + admin dashboard
│       ├── services/       # Axios API layer with token refresh
│       └── utils/          # Currency formatting, date helpers
└── shared/
    └── types/              # TypeScript interfaces (API contract source of truth)
```

## Key Design Decisions

- **All monetary values stored in paise** (integer) to avoid floating-point errors. ₹25,000 = `2500000` paise.
- **Dates stored as UTC**, converted to IST (`Asia/Kolkata`) only in the frontend display layer.
- **JWT access tokens held in memory** (not localStorage) with HttpOnly refresh token cookies — prevents XSS token theft.
- **Refresh token rotation** — each use issues a new token and invalidates the old one.
- **AES-256-GCM encryption** for customer ID numbers (Aadhaar, passport) at rest.
- **Date holds via TTL index** — 15-minute MongoDB TTL documents with a unique compound index on `{propertyId, date}` prevent double-booking at the database level.
- **Webhook-first payment verification** — Razorpay webhooks serve as the source of truth; frontend signature verification is a fast-path convenience.

## DPDP Act 2023 Compliance

Enforcement deadline: May 13, 2027. Penalties up to ₹250 crore.

- Itemized consent notice with non-pre-ticked checkbox before data collection
- Consent records stored with exact text, timestamp, IP, and user agent
- Data minimization — only name, email, phone, ID (foreign guests only), payment data
- Customer self-service endpoints: data export, correction, and erasure requests
- Retention policies: 3 years (customers), 5 years (bookings), 7 years (payments), 1 year (audit logs)
- Privacy policy page (English; Hindi planned for Phase 2)

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (free M0 cluster, Mumbai region)
- npm 10+

### Setup

```bash
# Clone
git clone https://github.com/MacDavicK/TriptiBunglow_Website.git
cd TriptiBunglow_Website

# Install all workspaces
npm install

# Backend environment
cp backend/.env.example backend/.env
# Fill in: MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
# Generate secrets: openssl rand -hex 64 (for JWT), openssl rand -hex 32 (for encryption)

# Frontend environment
cp frontend/.env.example frontend/.env

# Seed database (creates 2 properties + 1 admin user)
cd backend && npm run seed

# Run backend (port 5000)
npm run dev

# Run frontend (port 5173, separate terminal)
cd ../frontend && npm run dev
```

### Third-Party Credentials (needed for full functionality)

| Service | When Needed | Setup |
|---|---|---|
| Razorpay test account | Payment flows | [dashboard.razorpay.com](https://dashboard.razorpay.com) |
| Google service account | Calendar sync | Google Cloud Console → Calendar API |
| Cloudinary | Image uploads | [cloudinary.com](https://cloudinary.com) |
| Resend | Email notifications | [resend.com](https://resend.com) |

These can stay as placeholders during initial development — the app runs without them using stub services.

## License

Private — not open source.
