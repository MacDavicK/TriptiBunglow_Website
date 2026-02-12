import { body, query } from 'express-validator';

export const getMyDataValidation = [
  query('bookingId')
    .notEmpty()
    .isString()
    .withMessage('bookingId query parameter is required'),

  query('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
];

export const updateMyDataValidation = [
  body('bookingId')
    .notEmpty()
    .isString()
    .withMessage('bookingId is required'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),

  body('updates')
    .isObject()
    .withMessage('updates must be an object'),

  body('updates.name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),

  body('updates.phone')
    .optional()
    .isString()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('A valid phone number is required'),
];

export const deleteMyDataValidation = [
  body('bookingId')
    .notEmpty()
    .isString()
    .withMessage('bookingId is required'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
];
