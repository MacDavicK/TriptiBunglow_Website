import { body } from 'express-validator';
import mongoose from 'mongoose';
import { BOOKING_TYPE_VALUES } from '../utils/constants';

export const createBookingValidation = [
  body('propertyIds')
    .isArray({ min: 1, max: 2 })
    .withMessage('propertyIds must be an array of 1-2 property IDs'),
  body('propertyIds.*')
    .custom((value: string) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Each propertyId must be a valid ObjectId'),

  body('checkIn')
    .isISO8601()
    .withMessage('checkIn must be a valid ISO 8601 date')
    .custom((value: string) => {
      const checkIn = new Date(value);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return checkIn >= today;
    })
    .withMessage('checkIn must be today or a future date'),

  body('checkOut')
    .isISO8601()
    .withMessage('checkOut must be a valid ISO 8601 date')
    .custom((value: string, { req }) => {
      const checkOut = new Date(value);
      const checkIn = new Date(req.body.checkIn);
      return checkOut > checkIn;
    })
    .withMessage('checkOut must be after checkIn'),

  body('bookingType')
    .isIn(BOOKING_TYPE_VALUES)
    .withMessage(`bookingType must be one of: ${BOOKING_TYPE_VALUES.join(', ')}`),

  body('guestCount')
    .isInt({ min: 1 })
    .withMessage('guestCount must be a positive integer'),

  body('specialRequests')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('specialRequests must be a string under 1000 characters'),

  // Customer fields
  body('customer.name')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name is required (2-100 characters)'),

  body('customer.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email address is required'),

  body('customer.phone')
    .notEmpty()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('A valid phone number is required (10-15 digits)'),

  body('customer.nationality')
    .isIn(['indian', 'foreign'])
    .withMessage('Nationality must be indian or foreign'),

  body('customer.idType')
    .optional()
    .isIn(['aadhaar', 'passport', 'driving_license', 'voter_id'])
    .withMessage('Invalid ID type'),

  body('customer.idNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 4, max: 50 })
    .withMessage('ID number must be 4-50 characters'),

  body('customer.address')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address is required (5-500 characters)'),

  body('customer.panNumber')
    .optional()
    .isString()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .withMessage('PAN must be in format ABCDE1234F'),

  body('customer.aadhaarDocumentUrl')
    .optional()
    .isString()
    .isURL()
    .withMessage('Aadhaar document URL must be a valid URL'),

  body('customer.panDocumentUrl')
    .optional()
    .isString()
    .isURL()
    .withMessage('PAN document URL must be a valid URL'),

  // Booking-level fields
  body('reasonForRenting')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Reason for renting is required (3-500 characters)'),

  body('termsAcceptedAt')
    .notEmpty()
    .isISO8601()
    .withMessage('termsAcceptedAt must be a valid ISO 8601 date'),

  body('termsVersion')
    .notEmpty()
    .isString()
    .withMessage('Terms version is required'),

  // Consent fields
  body('consent.consentVersion')
    .notEmpty()
    .withMessage('Consent version is required'),

  body('consent.purposesConsented')
    .isArray({ min: 1 })
    .withMessage('At least one consent purpose is required'),

  body('consent.purposesConsented.*')
    .isString()
    .withMessage('Each consent purpose must be a string'),

  body('consent.consentText')
    .notEmpty()
    .isString()
    .withMessage('Consent text is required'),
];
