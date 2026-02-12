import { Router } from 'express';
import express from 'express';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';
import { validate } from '../middleware/validate.middleware';
import { createOrderValidation, verifyPaymentValidation } from '../validators/payment.validator';

const router = Router();

router.post('/create-order', validate(createOrderValidation), createOrder);
router.post('/verify', validate(verifyPaymentValidation), verifyPayment);

// Webhook requires raw body for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

export { router as paymentRoutes };
