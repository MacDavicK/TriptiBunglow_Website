import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/booking.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logAudit } from '../services/audit.service';
import { releaseDateHolds } from '../services/availability.service';

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

  booking.status = 'confirmed';
  await booking.save();

  await logAudit(
    'booking.approved',
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

  // TODO: Trigger deposit refund via Razorpay (Day 6)

  res.json({
    success: true,
    data: booking,
  });
});
