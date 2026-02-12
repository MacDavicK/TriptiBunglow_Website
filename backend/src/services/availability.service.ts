import mongoose, { Types } from 'mongoose';
import { DateHold } from '../models/date-hold.model';
import { Booking } from '../models/booking.model';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

/**
 * Generate an array of Date objects for each day between checkIn (inclusive) and checkOut (exclusive).
 */
const generateDateRange = (checkIn: Date, checkOut: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(checkIn);
  while (current < checkOut) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
};

/**
 * Check which dates are unavailable for a property in the given range.
 * Returns array of unavailable date strings (ISO).
 */
export const checkAvailability = async (
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<string[]> => {
  const dates = generateDateRange(checkIn, checkOut);

  const existingHolds = await DateHold.find({
    propertyId: new Types.ObjectId(propertyId),
    date: { $in: dates },
  }).lean();

  return existingHolds.map((hold) => hold.date.toISOString().split('T')[0]);
};

/**
 * Create date holds for a booking to prevent double-booking.
 * Uses unique compound index — duplicate key error = dates already taken.
 */
export const createDateHolds = async (
  propertyIds: string[],
  checkIn: Date,
  checkOut: Date,
  bookingId: Types.ObjectId
): Promise<void> => {
  const dates = generateDateRange(checkIn, checkOut);
  const holdDocs: Array<{
    propertyId: Types.ObjectId;
    date: Date;
    bookingId: Types.ObjectId;
  }> = [];

  for (const propertyId of propertyIds) {
    for (const date of dates) {
      holdDocs.push({
        propertyId: new Types.ObjectId(propertyId),
        date,
        bookingId,
      });
    }
  }

  try {
    await DateHold.insertMany(holdDocs, { ordered: false });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new AppError(
        'One or more requested dates are already booked',
        409,
        'DATES_UNAVAILABLE'
      );
    }
    throw err;
  }
};

/**
 * Release date holds for a booking (on cancellation or expiry).
 */
export const releaseDateHolds = async (bookingId: Types.ObjectId): Promise<void> => {
  const result = await DateHold.deleteMany({ bookingId });
  logger.info({ bookingId, deletedCount: result.deletedCount }, 'Released date holds');
};

/**
 * Get availability for an entire month for a property.
 * Returns an object mapping date strings to availability status.
 */
export const getMonthAvailability = async (
  propertyId: string,
  year: number,
  month: number
): Promise<Array<{ date: string; available: boolean }>> => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const holds = await DateHold.find({
    propertyId: new Types.ObjectId(propertyId),
    date: { $gte: startDate, $lt: endDate },
  }).lean();

  const confirmedBookings = await Booking.find({
    propertyIds: new Types.ObjectId(propertyId),
    status: { $in: ['confirmed', 'checked_in'] },
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  }).lean();

  const unavailableDates = new Set<string>();

  for (const hold of holds) {
    unavailableDates.add(hold.date.toISOString().split('T')[0]);
  }

  for (const booking of confirmedBookings) {
    const dates = generateDateRange(booking.checkIn, booking.checkOut);
    for (const d of dates) {
      unavailableDates.add(d.toISOString().split('T')[0]);
    }
  }

  const result: Array<{ date: string; available: boolean }> = [];
  const current = new Date(startDate);
  while (current < endDate) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      available: !unavailableDates.has(dateStr),
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};
