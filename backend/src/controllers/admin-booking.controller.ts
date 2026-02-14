import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/booking.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logAudit } from '../services/audit.service';
import { releaseDateHolds } from '../services/availability.service';
import { sendBookingConfirmation } from '../services/notification.service';
import * as calendarService from '../services/calendar.service';
import { logger } from '../utils/logger';

export const listBookings = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page as string | undefined;
  const limit = req.query.limit as string | undefined;
  const status = req.query.status as string | undefined;
  const propertyId = req.query.propertyId as string | undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;

  const pageNum = Math.max(1, parseInt(page || '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    filter.propertyIds = new mongoose.Types.ObjectId(propertyId);
  }

  if (fromDate || toDate) {
    filter.checkIn = {};
    if (fromDate) (filter.checkIn as Record<string, unknown>).$gte = new Date(fromDate as string);
    if (toDate) (filter.checkIn as Record<string, unknown>).$lte = new Date(toDate as string);
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('customerId', 'name phone')
      .populate('propertyIds', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid booking ID', 400, 'INVALID_ID');
  }

  const booking = await Booking.findById(id)
    .populate('customerId')
    .populate('propertyIds')
    .populate('consentRecordId')
    .populate('damageReportId')
    .lean();

  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * PATCH /api/admin/bookings/:id/approve
 * Special bookings: pending_approval → pending_payment (admin approved, await UPI confirmation)
 */
export const approveBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.status !== 'pending_approval') {
    throw new AppError(
      `Cannot approve booking with status "${booking.status}"`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  booking.status = 'pending_payment';
  await booking.save();

  await logAudit(
    'booking.approved_pending_payment',
    'Booking',
    booking._id,
    req.adminId || 'unknown',
    { previousStatus: 'pending_approval' }
  );

  res.json({
    success: true,
    data: booking,
  });
});

export const rejectBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.status !== 'pending_approval') {
    throw new AppError(
      `Cannot reject booking with status "${booking.status}"`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  booking.status = 'cancelled';
  await booking.save();

  // Release date holds
  await releaseDateHolds(booking._id);

  await logAudit(
    'booking.rejected',
    'Booking',
    booking._id,
    req.adminId || 'unknown',
    { previousStatus: 'pending_approval' }
  );

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * PATCH /api/admin/bookings/:id/confirm-payment
 * Admin confirms UPI payment received: pending_payment → confirmed
 * Fires calendar event creation + confirmation email.
 */
export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid booking ID', 400, 'INVALID_ID');
  }

  const booking = await Booking.findById(id)
    .populate('customerId')
    .populate('propertyIds');

  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.status !== 'pending_payment') {
    throw new AppError(
      `Cannot confirm payment for booking with status "${booking.status}". Must be pending_payment.`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  booking.status = 'confirmed';
  booking.paymentConfirmedAt = new Date();
  booking.paymentConfirmedBy = new mongoose.Types.ObjectId(req.adminId || 'unknown');
  await booking.save();

  await logAudit(
    'booking.payment_confirmed',
    'Booking',
    booking._id,
    req.adminId || 'unknown',
    { previousStatus: 'pending_payment' }
  );

  // Fire-and-forget: create Google Calendar event
  const populatedBooking = booking as any;
  calendarService.createCalendarEvent(populatedBooking).catch((err) => {
    logger.error({ err, bookingId: booking.bookingId }, 'Failed to create calendar event (non-blocking)');
  });

  // Fire-and-forget: send confirmation email to customer
  if (populatedBooking.customerId) {
    sendBookingConfirmation(populatedBooking, populatedBooking.customerId).catch((err) => {
      logger.error({ err, bookingId: booking.bookingId }, 'Failed to send confirmation email (non-blocking)');
    });
  }

  res.json({
    success: true,
    data: {
      bookingId: booking.bookingId,
      status: booking.status,
      paymentConfirmedAt: booking.paymentConfirmedAt,
    },
  });
});

export const checkIn = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(
      `Cannot check in booking with status "${booking.status}"`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  booking.status = 'checked_in';
  await booking.save();

  await logAudit(
    'booking.checked_in',
    'Booking',
    booking._id,
    req.adminId || 'unknown'
  );

  res.json({
    success: true,
    data: booking,
  });
});

export const checkOut = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.status !== 'checked_in') {
    throw new AppError(
      `Cannot check out booking with status "${booking.status}"`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  booking.status = 'checked_out';
  booking.depositRefundAmount = booking.depositAmount; // Full refund by default
  await booking.save();

  await logAudit(
    'booking.checked_out',
    'Booking',
    booking._id,
    req.adminId || 'unknown',
    { depositRefundAmount: booking.depositRefundAmount }
  );

  res.json({
    success: true,
    data: booking,
  });
});

/**
 * POST /api/admin/bookings/:id/refund
 * Manual refund tracking (Razorpay disabled — owner handles UPI refund manually).
 * Records refund amount, method, and reason in audit log.
 */
export const processRefund = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid booking ID', 400, 'INVALID_ID');
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  if (booking.status !== 'checked_out') {
    throw new AppError(
      `Cannot process refund for booking with status "${booking.status}". Must be checked out.`,
      400,
      'INVALID_STATUS'
    );
  }

  const refundAmount = (req.body.refundAmount as number) ?? booking.depositRefundAmount ?? booking.depositAmount;
  const refundMethod = (req.body.refundMethod as string) || 'upi';
  const reason = (req.body.reason as string) || 'Security deposit refund';

  if (refundAmount <= 0) {
    throw new AppError('No refund amount to process', 400, 'NO_REFUND_AMOUNT');
  }

  booking.depositRefundAmount = refundAmount;
  booking.status = 'refunded';
  await booking.save();

  await logAudit(
    'booking.refund_processed',
    'Booking',
    booking._id,
    req.adminId || 'unknown',
    { amount: refundAmount, method: refundMethod, reason }
  );

  res.json({
    success: true,
    data: {
      bookingId: booking.bookingId,
      status: booking.status,
      refund: {
        amount: refundAmount,
        method: refundMethod,
        reason,
      },
    },
  });
});
