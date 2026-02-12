// TODO: Implement in Day 6 — Razorpay integration
// This service will handle:
// - createOrder(bookingId, amount): Create a Razorpay order
// - verifyPayment(orderId, paymentId, signature): Verify HMAC-SHA256 signature
// - processRefund(paymentId, amount, reason): Process deposit refunds
// - handleWebhookEvent(event, payload): Process payment.captured / payment.failed

import { logger } from '../utils/logger';

export const createOrder = async (
  _bookingId: string,
  _amount: number
): Promise<null> => {
  logger.warn('payment.service.createOrder is a stub — implement with Razorpay');
  return null;
};

export const verifyPayment = async (
  _orderId: string,
  _paymentId: string,
  _signature: string
): Promise<boolean> => {
  logger.warn('payment.service.verifyPayment is a stub — implement with Razorpay');
  return false;
};

export const processRefund = async (
  _paymentId: string,
  _amount: number,
  _reason: string
): Promise<null> => {
  logger.warn('payment.service.processRefund is a stub — implement with Razorpay');
  return null;
};
