import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DateHold } from '../models/date-hold.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logAudit } from '../services/audit.service';

// A "blocked date" is a DateHold with a special sentinel bookingId representing admin block
const ADMIN_BLOCK_SENTINEL = new mongoose.Types.ObjectId('000000000000000000000000');

export const listBlockedDates = catchAsync(async (req: Request, res: Response) => {
  const propertyId = req.query.propertyId as string | undefined;

  const filter: Record<string, unknown> = {
    bookingId: ADMIN_BLOCK_SENTINEL,
  };

  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    filter.propertyId = new mongoose.Types.ObjectId(propertyId);
  }

  const blockedDates = await DateHold.find(filter)
    .populate('propertyId', 'name slug')
    .sort({ date: 1 })
    .lean();

  res.json({
    success: true,
    data: blockedDates,
  });
});

export const blockDates = catchAsync(async (req: Request, res: Response) => {
  const { propertyId, dates } = req.body;

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    throw new AppError('Valid propertyId is required', 400, 'INVALID_PROPERTY');
  }

  if (!Array.isArray(dates) || dates.length === 0) {
    throw new AppError('dates must be a non-empty array of ISO date strings', 400, 'INVALID_DATES');
  }

  const holdDocs = dates.map((dateStr: string) => ({
    propertyId: new mongoose.Types.ObjectId(propertyId),
    date: new Date(dateStr),
    bookingId: ADMIN_BLOCK_SENTINEL,
  }));

  try {
    const result = await DateHold.insertMany(holdDocs, { ordered: false });

    await logAudit(
      'dates.blocked',
      'DateHold',
      new mongoose.Types.ObjectId(propertyId),
      req.adminId || 'unknown',
      { datesCount: result.length }
    );

    res.status(201).json({
      success: true,
      data: { blockedCount: result.length },
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new AppError(
        'One or more dates are already blocked or booked',
        409,
        'DATES_CONFLICT'
      );
    }
    throw err;
  }
});

export const unblockDate = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ID', 400, 'INVALID_ID');
  }

  const hold = await DateHold.findOneAndDelete({
    _id: id,
    bookingId: ADMIN_BLOCK_SENTINEL,
  });

  if (!hold) {
    throw new AppError('Blocked date not found', 404, 'NOT_FOUND');
  }

  await logAudit(
    'dates.unblocked',
    'DateHold',
    hold.propertyId,
    req.adminId || 'unknown',
    { date: hold.date }
  );

  res.json({
    success: true,
    data: { message: 'Date unblocked' },
  });
});
