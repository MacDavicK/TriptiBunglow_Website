// TODO: Re-enable when Razorpay gateway is activated
// import { validate } from '../middleware/validate.middleware';
// import { createOrderValidation, verifyPaymentValidation } from '../validators/payment.validator';

import { Router } from 'express';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';

const router = Router();

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

export { router as paymentRoutes };
