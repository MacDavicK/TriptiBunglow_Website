import { body } from 'express-validator';

export const createDamageReportValidation = [
  body('description')
    .notEmpty()
    .isString()
    .trim()
    .withMessage('Description is required'),

  body('estimatedDamage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated damage must be a non-negative integer (in paise)'),

  body('deductionAmount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Deduction amount must be a non-negative integer (in paise)'),

  body('photos')
    .optional()
    .isArray()
    .withMessage('Photos must be an array of URLs'),

  body('photos.*')
    .optional()
    .isString()
    .isURL()
    .withMessage('Each photo must be a valid URL'),
];
