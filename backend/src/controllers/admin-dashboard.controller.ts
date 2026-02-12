import { Request, Response } from 'express';
import { Booking } from '../models/booking.model';
import { catchAsync } from '../utils/catch-async';

export const getStats = catchAsync(async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [
    totalBookings,
    revenueResult,
    upcomingBookings,
    totalDaysInMonth,
    bookedDays,
  ] = await Promise.all([
    Booking.countDocuments({
      status: { $nin: ['cancelled', 'refunded'] },
    }),
    Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCharged' },
        },
      },
    ]),
    Booking.countDocuments({
      status: 'confirmed',
      checkIn: { $gte: now },
    }),
    Promise.resolve(
      Math.ceil((endOfMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
    ),
    Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'checked_in', 'checked_out'] },
          checkIn: { $lt: endOfMonth },
          checkOut: { $gt: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalNights: { $sum: '$nights' },
        },
      },
    ]),
  ]);

  const revenueThisMonth = revenueResult.length > 0 ? revenueResult[0].total : 0;
  const totalBookedNights = bookedDays.length > 0 ? bookedDays[0].totalNights : 0;
  // 2 properties × days in month = total available days
  const occupancyRate = totalDaysInMonth > 0
    ? Math.round((totalBookedNights / (2 * totalDaysInMonth)) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      totalBookings,
      revenueThisMonth,
      upcomingBookings,
      occupancyRate,
    },
  });
});
