# Cursor Frontend Scaffold Prompt — Day 1-2

> **Open the `/frontend` directory in Cursor. Open Agent mode (Cmd+I or the Composer panel). Paste everything below the line.**

---

## Context

Read the `.cursorrules` file in this directory and the root `.cursorrules` for conventions. Also reference `../shared/types/` for all API type contracts. This is the frontend for a vacation bungalow booking system — two properties in Thane, Maharashtra, India.

## Pre-flight Check

Before writing any code:
1. Confirm we're in the `frontend/` directory
2. Confirm `../.cursorrules` and `./.cursorrules` exist and read them
3. Confirm `../shared/types/` has the TypeScript interface files (index.ts, property.ts, booking.ts, customer.ts, payment.ts, api.ts)

## Task: Scaffold the complete React + Vite + TypeScript + Tailwind frontend

### Step 1: Initialize the Vite project

Run: `npm create vite@latest . -- --template react-ts`

(If it asks to overwrite, say yes — the only existing files are .cursorrules and .env.example)

Then install dependencies:

**Runtime**:
- react-router-dom (v7)
- @tanstack/react-query (v5)
- react-hook-form
- @hookform/resolvers
- zod
- axios
- date-fns
- date-fns-tz
- clsx
- tailwind-merge
- lucide-react (icons)
- react-hot-toast (notifications)
- react-day-picker (calendar component)

**Dev**:
- tailwindcss @tailwindcss/forms @tailwindcss/typography
- postcss autoprefixer
- @types/node

Configure Tailwind CSS:
- Create `tailwind.config.js` with content paths for `./src/**/*.{ts,tsx}`, extend theme with `fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }`
- Add `@tailwindcss/forms` and `@tailwindcss/typography` to plugins
- Create `postcss.config.js`
- Replace `src/index.css` with Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
- Add Inter font via `<link>` in `index.html`

Update `vite.config.ts`:
- Add path alias: `@` → `./src`
- Add path alias: `@shared` → `../shared`

Update `tsconfig.json` / `tsconfig.app.json`:
- Add paths: `"@/*": ["./src/*"]`, `"@shared/*": ["../shared/*"]`
- Set strict: true

### Step 2: Create utility functions

`src/utils/cn.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

`src/utils/format-currency.ts`:
- `formatCurrency(paise: number): string` → uses Intl.NumberFormat('en-IN') to display ₹X,XXX
- `formatCurrencyCompact(paise: number): string` → ₹25K format for small spaces

`src/utils/format-date.ts`:
- `formatDateIST(utcDate: string | Date): string` → "15 Mar 2026"
- `formatDateRangeIST(checkIn: string, checkOut: string): string` → "15–17 Mar 2026"
- `formatRelativeIST(utcDate: string | Date): string` → "2 days from now", "Yesterday"

`src/utils/constants.ts`:
- `API_BASE_URL` from `import.meta.env.VITE_API_BASE_URL`
- `RAZORPAY_KEY_ID` from `import.meta.env.VITE_RAZORPAY_KEY_ID`
- Property slugs, booking statuses, status badge color maps

### Step 3: Create the API layer

`src/services/api.ts`:
- Create Axios instance with baseURL from env, withCredentials: true, timeout: 10000
- Request interceptor: attach access token from auth context (in-memory) as Bearer header
- Response interceptor: on 401, attempt token refresh via `/api/admin/auth/refresh`, retry original request. On refresh failure, redirect to /admin/login.
- Export the instance

`src/services/property.api.ts`:
- `getProperties()` → GET /properties → returns Property[]
- `getProperty(slug: string)` → GET /properties/:slug → returns Property

`src/services/booking.api.ts`:
- `getAvailability(propertyId: string, month: number, year: number)` → GET /availability
- `createBooking(data: CreateBookingRequest)` → POST /bookings

`src/services/payment.api.ts`:
- `createOrder(bookingId: string)` → POST /payments/create-order → returns CreateOrderResponse
- `verifyPayment(data: VerifyPaymentRequest)` → POST /payments/verify

`src/services/admin.api.ts`:
- `login(email: string, password: string)` → POST /admin/auth/login
- `refreshToken()` → POST /admin/auth/refresh
- `logout()` → POST /admin/auth/logout
- `getBookings(params: { page?, limit?, status?, propertyId? })` → GET /admin/bookings
- `getBooking(id: string)` → GET /admin/bookings/:id
- `approveBooking(id: string)` → PATCH /admin/bookings/:id/approve
- `rejectBooking(id: string, reason: string)` → PATCH /admin/bookings/:id/reject
- `checkInBooking(id: string)` → PATCH /admin/bookings/:id/check-in
- `checkOutBooking(id: string)` → PATCH /admin/bookings/:id/check-out
- `getDashboardStats()` → GET /admin/dashboard/stats
- `getBlockedDates(propertyId: string)` → GET /admin/blocked-dates
- `blockDates(propertyId: string, dates: string[])` → POST /admin/blocked-dates
- `unblockDate(id: string)` → DELETE /admin/blocked-dates/:id

### Step 4: Create React Query hooks

`src/hooks/useProperties.ts` → useQuery for property list and detail
`src/hooks/useAvailability.ts` → useQuery for monthly availability (staleTime: 30s)
`src/hooks/useBooking.ts` → useMutation for createBooking
`src/hooks/useRazorpay.ts`:
- Dynamically load Razorpay script
- `openCheckout(orderId, amount, keyId, onSuccess, onFailure)` function
- Handle the Razorpay modal lifecycle

`src/hooks/useAuth.ts` → Custom hook that reads from AuthContext: `{ isAuthenticated, admin, login, logout }`

### Step 5: Create Auth Context

`src/contexts/AuthContext.tsx`:
- Store access token in React state (NOT localStorage)
- Store admin info `{ id, email, name, role }` in state
- `login(email, password)` → call admin.api.login → store token + admin info
- `logout()` → call admin.api.logout → clear state → redirect to /admin/login
- `refreshAccessToken()` → call admin.api.refreshToken → update token in state
- Wrap app in `<AuthProvider>`

### Step 6: Create UI components (reusable primitives)

Build these in `src/components/ui/`:

- **Button.tsx** — Variants: `primary` (indigo-600), `secondary` (gray), `danger` (red-600), `ghost` (transparent). Sizes: `sm`, `md`, `lg`. Loading state with spinner. Disabled state.
- **Input.tsx** — Styled text input with label, error message, helper text. Integrates with react-hook-form via forwardRef.
- **Select.tsx** — Styled select dropdown with same pattern as Input.
- **Card.tsx** — Container with white bg, rounded-xl, shadow-sm, p-6. Composable: Card, CardHeader, CardContent, CardFooter.
- **Badge.tsx** — Status badge with color variants matching booking statuses: confirmed=green, pending_approval=amber, hold=blue, checked_in=purple, checked_out=gray, cancelled=red.
- **Modal.tsx** — Centered overlay modal with backdrop blur, close button, title. Uses React Portal.
- **Spinner.tsx** — Animated loading spinner (SVG, indigo-600).
- **Skeleton.tsx** — Pulse animation skeleton for loading states. Variants: text, card, table-row.
- **EmptyState.tsx** — Centered message with optional icon and action button.
- **ErrorBanner.tsx** — Red alert banner with error message and retry button.
- **PageContainer.tsx** — Max-w-7xl centered container with responsive px-4 lg:px-8 padding.

### Step 7: Create layout components

`src/components/layout/Header.tsx`:
- Logo/brand name on left ("Thane Bungalows")
- Desktop nav: Home, Properties, Contact (Phase 2)
- Mobile: hamburger menu with slide-out drawer
- Sticky top, white bg, bottom border

`src/components/layout/Footer.tsx`:
- Contact info, privacy policy link, copyright
- Simple single-row on mobile, multi-column on desktop

`src/components/layout/AdminSidebar.tsx`:
- Vertical nav: Dashboard, Bookings, Blocked Dates, Logout
- Active state highlighting
- Collapsible on mobile (hamburger)

`src/components/layout/AdminLayout.tsx`:
- Sidebar + main content area
- Protected: redirect to /admin/login if not authenticated
- Responsive: sidebar hidden on mobile, toggled via hamburger

`src/components/layout/PublicLayout.tsx`:
- Header + main content + Footer

### Step 8: Create page components

**Public pages:**

`src/pages/HomePage.tsx`:
- Hero section: Large heading "Vacation Bungalows in Thane", subheading about the two properties, CTA button "View Properties"
- Property cards section: Show both bungalows with photo, name, rate (₹25,000/night), amenities chips, "Book Now" button
- Simple, clean, trust-building design. Think Airbnb meets boutique hotel.

`src/pages/PropertyPage.tsx`:
- Property details: photos (grid/carousel), description, amenities list, rate, max guests
- Availability calendar: Interactive month view using react-day-picker. Available dates are selectable (green), unavailable dates are disabled (gray/strikethrough). Selected range highlighted in indigo.
- Booking form sidebar (desktop) or bottom sheet (mobile): date range summary, nights count, total price breakdown (₹25,000 × N nights + ₹5,000 deposit = total), guest count, "Proceed to Book" button
- Uses `useAvailability` hook to fetch data

`src/pages/BookingPage.tsx`:
- Multi-step form (3 steps with progress indicator):
  1. **Guest Details**: Name, email, phone, nationality (radio: Indian/Foreign). If foreign: ID type dropdown + ID number field.
  2. **Special Requests**: Booking type toggle (Standard/Special Event). If special: textarea for requirements. Guest count.
  3. **Review & Pay**: Full booking summary, price breakdown, DPDP consent checkbox (non-pre-ticked!) with link to privacy policy, "Pay ₹XX,XXX" button
- Uses react-hook-form with zod validation
- On submit for standard: call createBooking → createOrder → open Razorpay checkout
- On submit for special: call createBooking → show "Request Submitted" confirmation

`src/pages/BookingConfirmationPage.tsx`:
- Success state: green checkmark, booking ID, dates, property name
- "You'll receive a confirmation email and WhatsApp message"
- "Save to Calendar" button (generates .ics file download)
- "Back to Home" link

`src/pages/PrivacyPolicyPage.tsx`:
- DPDP-compliant privacy policy rendered from markdown or structured content
- Sections: Data Fiduciary Identity, Data Collected, Purposes, Third Parties, Retention Periods, Your Rights, Grievance Officer
- Clean, readable typography

**Admin pages:**

`src/pages/admin/LoginPage.tsx`:
- Centered card with email + password form
- "Login" button with loading state
- Error display for invalid credentials
- Rate limit warning after failed attempts

`src/pages/admin/DashboardPage.tsx`:
- Stats cards row: Total Bookings (this month), Revenue (this month), Upcoming Bookings, Occupancy Rate
- Recent bookings table (5 most recent)
- Quick actions: "Block Dates", "View All Bookings"
- Uses `useQuery` with `getDashboardStats`

`src/pages/admin/BookingsPage.tsx`:
- Filterable table: status dropdown, date range picker, property dropdown
- Table columns: Booking ID, Guest Name, Phone, Property, Check-in, Check-out, Status (Badge), Amount, Actions
- Action buttons per row: View, Approve (if pending), Check-in, Check-out
- Pagination controls
- Mobile: card layout instead of table

`src/pages/admin/BookingDetailPage.tsx`:
- Full booking info: guest details, property, dates, payment status, timeline
- Action buttons based on status: Approve/Reject (pending_approval), Check-in (confirmed), Check-out + Refund Deposit (checked_in)
- Damage report section (if checked_in): photo upload placeholder, damage amount input, "Deduct & Refund" button (stub for Day 6-8)

`src/pages/admin/BlockedDatesPage.tsx`:
- Calendar view for each property
- Click dates to toggle blocked/unblocked
- Blocked dates shown in red
- Save button to persist changes

### Step 9: Create routing

`src/App.tsx`:
- QueryClientProvider wrapping AuthProvider wrapping RouterProvider
- React Router v7 routes:
  - `/` → HomePage (PublicLayout)
  - `/property/:slug` → PropertyPage (PublicLayout)
  - `/book/:slug` → BookingPage (PublicLayout)
  - `/booking/confirmation/:bookingId` → BookingConfirmationPage (PublicLayout)
  - `/privacy-policy` → PrivacyPolicyPage (PublicLayout)
  - `/admin/login` → LoginPage (minimal layout, no sidebar)
  - `/admin` → DashboardPage (AdminLayout, protected)
  - `/admin/bookings` → BookingsPage (AdminLayout, protected)
  - `/admin/bookings/:id` → BookingDetailPage (AdminLayout, protected)
  - `/admin/blocked-dates` → BlockedDatesPage (AdminLayout, protected)
  - `*` → 404 page

### Step 10: Final verification

After all files are created:
1. Run `npm install` and confirm no errors
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL=http://localhost:5000/api` and a placeholder Razorpay key
3. Run `npm run dev` and confirm Vite starts on port 5173
4. Navigate to `http://localhost:5173` — HomePage should render with the two property cards (using mock/placeholder data since backend may not be running)
5. Navigate to `/admin/login` — login form should render
6. Check that there are no TypeScript errors in the terminal
7. Check responsive design: resize browser to mobile width (375px) and verify layout doesn't break

For any pages that need backend data, use placeholder/mock data in the components for now. Add a comment `// TODO: Replace with real API call` where mock data is used, so we can wire it up once the backend is running.

Report any failures and fix them before finishing.
