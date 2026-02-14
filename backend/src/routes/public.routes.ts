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

// Privacy policy (DPDP Act compliance)
router.get('/privacy-policy', (_req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0',
      lastUpdated: '2024-01-01',
      dataController: 'Bungalow Property Management',
      dataRetention: {
        bookingRecords: '3 years from date of collection',
        paymentRecords: 'As required by applicable tax and financial regulations',
        personalData: '3 years, or until erasure request under DPDP Act',
      },
      dataRights: {
        access: 'You may request a copy of your personal data via GET /api/customer/my-data',
        correction: 'You may correct your name and phone via PATCH /api/customer/my-data',
        erasure: 'You may request anonymization of your personal data via DELETE /api/customer/my-data',
        note: 'Booking and payment records are retained as required by law even after data erasure.',
      },
      dataCollected: [
        'Name',
        'Email address',
        'Phone number',
        'Nationality',
        'Government ID type and number (encrypted at rest)',
      ],
      purposes: [
        'Booking management and confirmation',
        'Payment processing',
        'Legal compliance and record keeping',
        'Communication regarding your booking',
      ],
      security: 'All sensitive data (government ID numbers) is encrypted using AES-256-GCM at rest.',
      contact: 'For data-related inquiries, please contact us using the information on our website.',
    },
  });
});

export { router as publicRoutes };
