import { Router } from 'express';
import { login, refreshToken, logout } from '../controllers/admin-auth.controller';
import {
  listBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  checkIn,
  checkOut,
} from '../controllers/admin-booking.controller';
import { getStats } from '../controllers/admin-dashboard.controller';
import {
  listBlockedDates,
  blockDates,
  unblockDate,
} from '../controllers/admin-blocked-dates.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginValidation } from '../validators/admin-auth.validator';
import { loginLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

// Auth routes (public — no JWT required)
router.post('/auth/login', loginLimiter, validate(loginValidation), login);
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', logout);

// All routes below require authentication
router.use(requireAuth);

// Dashboard
router.get('/dashboard/stats', getStats);

// Booking management
router.get('/bookings', listBookings);
router.get('/bookings/:id', getBooking);
router.patch('/bookings/:id/approve', approveBooking);
router.patch('/bookings/:id/reject', rejectBooking);
router.patch('/bookings/:id/check-in', checkIn);
router.patch('/bookings/:id/check-out', checkOut);

// Blocked dates
router.get('/blocked-dates', listBlockedDates);
router.post('/blocked-dates', blockDates);
router.delete('/blocked-dates/:id', unblockDate);

export { router as adminRoutes };
