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

export type DateStatus = 'available' | 'pending' | 'booked' | 'blocked';

/**
 * Get availability for an entire month for a property.
 * Returns per-date status: available, pending, booked, or blocked.
 *
 * - blocked: admin-blocked dates (DateHold with sentinel bookingId)
 * - booked: confirmed or checked-in bookings, or active booking date holds
 * - pending: pending_payment or pending_approval bookings
 * - available: everything else
 */
export const getMonthAvailability = async (
  propertyId: string,
  year: number,
  month: number
): Promise<Array<{ date: string; status: DateStatus; available: boolean }>> => {
  const ADMIN_BLOCK_SENTINEL = '000000000000000000000000';

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const holds = await DateHold.find({
    propertyId: new Types.ObjectId(propertyId),
    date: { $gte: startDate, $lt: endDate },
  }).lean();

  const bookings = await Booking.find({
    propertyIds: new Types.ObjectId(propertyId),
    status: { $in: ['pending_payment', 'pending_approval', 'confirmed', 'checked_in'] },
    checkIn: { $lt: endDate },
    checkOut: { $gt: startDate },
  }).lean();

  // Separate admin-blocked holds from booking holds
  const blockedDates = new Set<string>();
  const holdDates = new Set<string>();

  for (const hold of holds) {
    const dateStr = hold.date.toISOString().split('T')[0];
    if (hold.bookingId.toString() === ADMIN_BLOCK_SENTINEL) {
      blockedDates.add(dateStr);
    } else {
      holdDates.add(dateStr);
    }
  }

  // Separate pending vs confirmed/checked-in booking dates
  const pendingDates = new Set<string>();
  const bookedDates = new Set<string>();

  for (const booking of bookings) {
    const dates = generateDateRange(booking.checkIn, booking.checkOut);
    const isPending = ['pending_payment', 'pending_approval'].includes(booking.status);
    for (const d of dates) {
      const dateStr = d.toISOString().split('T')[0];
      if (isPending) {
        pendingDates.add(dateStr);
      } else {
        bookedDates.add(dateStr);
      }
    }
  }

  const result: Array<{ date: string; status: DateStatus; available: boolean }> = [];
  const current = new Date(startDate);
  while (current < endDate) {
    const dateStr = current.toISOString().split('T')[0];

    let status: DateStatus = 'available';
    if (bookedDates.has(dateStr) || holdDates.has(dateStr)) {
      status = 'booked';
    } else if (blockedDates.has(dateStr)) {
      status = 'blocked';
    } else if (pendingDates.has(dateStr)) {
      status = 'pending';
    }

    result.push({ date: dateStr, status, available: status === 'available' });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};
