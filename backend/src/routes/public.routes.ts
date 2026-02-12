import { Router } from 'express';
import { listProperties, getProperty } from '../controllers/property.controller';
import { createBooking } from '../controllers/booking.controller';
import { getAvailability } from '../controllers/availability.controller';
import { validate } from '../middleware/validate.middleware';
import { createBookingValidation } from '../validators/booking.validator';

const router = Router();

// Properties
router.get('/properties', listProperties);
router.get('/properties/:slug', getProperty);

// Availability
router.get('/availability', getAvailability);

// Booking creation
router.post('/bookings', validate(createBookingValidation), createBooking);

export { router as publicRoutes };
