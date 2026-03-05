import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { getMonthAvailability } from '../services/availability.service';

export const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const { propertyId, month, year } = req.query;

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId as string)) {
    throw new AppError('Valid propertyId is required', 400, 'INVALID_PROPERTY');
  }

  const monthNum = parseInt(month as string, 10);
  const yearNum = parseInt(year as string, 10);

  if (!monthNum || monthNum < 1 || monthNum > 12) {
    throw new AppError('month must be between 1 and 12', 400, 'INVALID_MONTH');
  }

  if (!yearNum || yearNum < 2024) {
    throw new AppError('Invalid year', 400, 'INVALID_YEAR');
  }

  const dates = await getMonthAvailability(
    propertyId as string,
    yearNum,
    monthNum
  );

  // Build backward-compat arrays + new per-date status data
  const available: string[] = [];
  const unavailable: string[] = [];

  for (const d of dates) {
    if (d.available) {
      available.push(d.date);
    } else {
      unavailable.push(d.date);
    }
  }

  res.json({
    success: true,
    data: {
      available,
      unavailable,
      dates, // per-date status for richer calendar rendering
    },
  });
});
