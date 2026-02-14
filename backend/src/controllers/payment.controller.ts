import { Request, Response } from 'express';
import { Booking } from '../models/booking.model';
import { Payment } from '../models/payment.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logAudit } from '../services/audit.service';
import * as paymentService from '../services/payment.service';
import * as calendarService from '../services/calendar.service';
import * as notificationService from '../services/notification.service';
import { logger } from '../utils/logger';

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;

  const booking = await Booking.findOne({ bookingId });
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  // Standard bookings must be in 'hold' status; special bookings in 'confirmed' (after admin approval)
  const validStatuses = ['hold', 'confirmed'];
  if (!validStatuses.includes(booking.status)) {
    throw new AppError(
      `Cannot create payment for booking with status "${booking.status}"`,
      400,
      'INVALID_STATUS'
    );
  }

  // Don't create duplicate orders
  if (booking.razorpayOrderId) {
    const existingPayment = await Payment.findOne({ razorpayOrderId: booking.razorpayOrderId });
    if (existingPayment && existingPayment.status === 'created') {
      // Return the existing order
      return res.json({
        success: true,
        data: {
          orderId: booking.razorpayOrderId,
          amount: booking.totalCharged,
          currency: 'INR',
          key: process.env.RAZORPAY_KEY_ID || '',
        },
      });
    }
  }

  const orderData = await paymentService.createOrder(booking._id, booking.totalCharged);

  await logAudit(
    'payment.order_created',
    'Booking',
    booking._id,
    'customer',
    { orderId: orderData.orderId, amount: orderData.amount }
  );

  res.json({
    success: true,
    data: orderData,
  });
});

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  // Verify the booking exists
  const existingBooking = await Booking.findOne({ bookingId });
  if (!existingBooking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  // Verify payment signature and update records
  const booking = await paymentService.verifyPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  // Bind request to order: the booking that was confirmed must match the client-supplied bookingId
  if (booking.bookingId !== bookingId) {
    throw new AppError('Booking ID does not match the payment order', 400, 'BOOKING_ORDER_MISMATCH');
  }

  // Fire-and-forget: create calendar event and send notifications
  const populatedBooking = booking as any;
  calendarService.createCalendarEvent(populatedBooking).catch((err) => {
    logger.error({ err }, 'Failed to create calendar event (non-blocking)');
  });

  if (populatedBooking.customerId) {
    notificationService
      .sendBookingConfirmation(populatedBooking, populatedBooking.customerId)
      .catch((err) => {
        logger.error({ err }, 'Failed to send booking confirmation (non-blocking)');
      });

    notificationService
      .sendAdminNotification(populatedBooking, populatedBooking.customerId)
      .catch((err) => {
        logger.error({ err }, 'Failed to send admin notification (non-blocking)');
      });
  }

  await logAudit(
    'payment.verified',
    'Booking',
    booking._id,
    'customer',
    { razorpayPaymentId: razorpay_payment_id }
  );

  res.json({
    success: true,
    data: {
      bookingId: booking.bookingId,
      status: 'confirmed',
      totalCharged: booking.totalCharged,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    },
  });
});

export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) {
    throw new AppError('Missing webhook signature', 400, 'MISSING_SIGNATURE');
  }

  // req.body is a raw Buffer from express.raw()
  const rawBody = req.body as Buffer;

  const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.warn('Invalid webhook signature received');
    throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');
  }

  const event = JSON.parse(rawBody.toString('utf-8'));
  const eventType = event.event as string;
  const paymentEntity = event.payload?.payment?.entity;

  if (!paymentEntity) {
    // Unknown event shape, acknowledge and ignore
    return res.json({ status: 'ok' });
  }

  const razorpayOrderId = paymentEntity.order_id as string;
  const razorpayPaymentId = paymentEntity.id as string;

  // Find the payment record
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    logger.warn({ razorpayOrderId }, 'Webhook: payment record not found — ignoring');
    return res.json({ status: 'ok' });
  }

  // Idempotency: check if we've already processed this event
  const alreadyProcessed = payment.webhookEvents.some(
    (we) => we.event === eventType && (we.payload as any)?.paymentId === razorpayPaymentId
  );

  if (alreadyProcessed) {
    logger.info({ eventType, razorpayPaymentId }, 'Webhook: duplicate event — skipping');
    return res.json({ status: 'ok' });
  }

  // Handle payment events
  if (eventType === 'payment.captured') {
    // Only update if not already captured (webhook is backup for verifyPayment)
    if (payment.status !== 'captured') {
      payment.status = 'captured';
      payment.razorpayPaymentId = razorpayPaymentId;

      await Booking.updateOne(
        { razorpayOrderId },
        { status: 'confirmed', razorpayPaymentId }
      );
    }
  } else if (eventType === 'payment.failed') {
    if (payment.status !== 'captured') {
      payment.status = 'failed';
    }
  }

  // Record the webhook event
  payment.webhookEvents.push({
    event: eventType,
    payload: { paymentId: razorpayPaymentId, ...paymentEntity },
    receivedAt: new Date(),
  });

  await payment.save();

  logger.info({ eventType, razorpayOrderId }, 'Webhook: processed successfully');

  // Always respond 200 to prevent Razorpay retries
  res.json({ status: 'ok' });
});
