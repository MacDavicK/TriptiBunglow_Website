import { body } from 'express-validator';

export const createOrderValidation = [
  body('bookingId')
    .notEmpty()
    .isString()
    .withMessage('bookingId is required'),
];

export const verifyPaymentValidation = [
  body('razorpay_order_id')
    .notEmpty()
    .isString()
    .withMessage('razorpay_order_id is required'),

  body('razorpay_payment_id')
    .notEmpty()
    .isString()
    .withMessage('razorpay_payment_id is required'),

  body('razorpay_signature')
    .notEmpty()
    .isString()
    .withMessage('razorpay_signature is required'),

  body('bookingId')
    .notEmpty()
    .isString()
    .withMessage('bookingId is required'),
];
