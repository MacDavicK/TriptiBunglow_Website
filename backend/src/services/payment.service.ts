// TODO: Re-enable when Razorpay gateway is activated
// All Razorpay payment logic is disabled. Manual UPI payment is currently active.

// import crypto from 'crypto';
// import { Types } from 'mongoose';
// import { razorpay } from '../config/razorpay';
// import { Payment } from '../models/payment.model';
// import { Booking } from '../models/booking.model';
// import { AppError } from '../utils/app-error';
// import { logger } from '../utils/logger';
//
// interface CreateOrderResult { orderId: string; amount: number; currency: string; key: string; }
// interface RefundResult { refundId: string; amount: number; reason: string; }
//
// export const createOrder = async (bookingId: Types.ObjectId, amount: number): Promise<CreateOrderResult> => { ... };
// export const verifyPayment = async (orderId: string, paymentId: string, signature: string) => { ... };
// export const processRefund = async (paymentId: string, amount: number, reason: string): Promise<RefundResult> => { ... };
// export const verifyWebhookSignature = (rawBody: Buffer, signature: string): boolean => { ... };

export const createOrder = async (): Promise<never> => {
  throw new Error('Razorpay is disabled. Use manual UPI payment.');
};

export const verifyPayment = async (): Promise<never> => {
  throw new Error('Razorpay is disabled. Use manual UPI payment.');
};

export const processRefund = async (): Promise<never> => {
  throw new Error('Razorpay is disabled. Use manual UPI payment.');
};

export const verifyWebhookSignature = (): boolean => false;
