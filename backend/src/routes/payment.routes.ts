import { Router } from 'express';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';
import { validate } from '../middleware/validate.middleware';
import { createOrderValidation, verifyPaymentValidation } from '../validators/payment.validator';

const router = Router();

router.post('/create-order', validate(createOrderValidation), createOrder);
router.post('/verify', validate(verifyPaymentValidation), verifyPayment);

// Webhook: raw body is parsed at app level (app.ts) for this path before mongoSanitize etc.
router.post('/webhook', handleWebhook);

export { router as paymentRoutes };
