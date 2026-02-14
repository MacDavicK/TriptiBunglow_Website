import crypto from 'crypto';
import { Types } from 'mongoose';
import { razorpay } from '../config/razorpay';
import { Payment } from '../models/payment.model';
import { Booking } from '../models/booking.model';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

interface RefundResult {
  refundId: string;
  amount: number;
  reason: string;
}

export const createOrder = async (
  bookingId: Types.ObjectId,
  amount: number
): Promise<CreateOrderResult> => {
  if (!razorpay) {
    throw new AppError('Payment gateway not configured', 503, 'PAYMENT_NOT_CONFIGURED');
  }

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: bookingId.toString(),
  });

  await Payment.create({
    razorpayOrderId: order.id,
    bookingId,
    amount,
    currency: 'INR',
    status: 'created',
  });

  await Booking.updateOne(
    { _id: bookingId },
    { razorpayOrderId: order.id }
  );

  return {
    orderId: order.id,
    amount,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID || '',
  };
};

export const verifyPayment = async (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new AppError('Payment gateway not configured', 503, 'PAYMENT_NOT_CONFIGURED');
  }

  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValid) {
    throw new AppError('Invalid payment signature', 400, 'INVALID_SIGNATURE');
  }

  // Update payment record
  await Payment.updateOne(
    { razorpayOrderId: orderId },
    { status: 'captured', razorpayPaymentId: paymentId }
  );

  // Update booking status to confirmed
  const booking = await Booking.findOneAndUpdate(
    { razorpayOrderId: orderId },
    { status: 'confirmed', razorpayPaymentId: paymentId },
    { new: true }
  )
    .populate('customerId')
    .populate('propertyIds');

  if (!booking) {
    throw new AppError('Booking not found for this payment', 404, 'BOOKING_NOT_FOUND');
  }

  return booking;
};

export const processRefund = async (
  paymentId: string,
  amount: number,
  reason: string
): Promise<RefundResult> => {
  if (!razorpay) {
    throw new AppError('Payment gateway not configured', 503, 'PAYMENT_NOT_CONFIGURED');
  }

  const refund = await (razorpay.payments as any).refund(paymentId, {
    amount,
    notes: { reason },
  });

  // Push refund record into the Payment document
  await Payment.updateOne(
    { razorpayPaymentId: paymentId },
    {
      $push: {
        refunds: {
          refundId: refund.id,
          amount,
          reason,
          createdAt: new Date(),
        },
      },
    }
  );

  return {
    refundId: refund.id,
    amount,
    reason,
  };
};

export const verifyWebhookSignature = (
  rawBody: Buffer,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not configured — cannot verify webhook');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
};
