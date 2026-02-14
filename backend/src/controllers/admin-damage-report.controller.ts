import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/booking.model';
import { DamageReport } from '../models/damage-report.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logAudit } from '../services/audit.service';

/**
 * POST /api/admin/bookings/:id/damage-report
 * Create a damage report for a checked-out booking.
 * Adjusts the deposit refund amount based on the deduction.
 */
export const createDamageReport = catchAsync(async (req: Request, res: Response) => {
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
      `Cannot create damage report for booking with status "${booking.status}". Booking must be checked out.`,
      400,
      'INVALID_STATUS'
    );
  }

  if (booking.damageReportId) {
    throw new AppError('A damage report already exists for this booking', 409, 'DAMAGE_REPORT_EXISTS');
  }

  const { description, estimatedDamage, deductionAmount, photos } = req.body;

  // Validate deduction doesn't exceed deposit
  if (deductionAmount > booking.depositAmount) {
    throw new AppError(
      `Deduction amount (${deductionAmount}) cannot exceed deposit amount (${booking.depositAmount})`,
      400,
      'DEDUCTION_EXCEEDS_DEPOSIT'
    );
  }

  const damageReport = await DamageReport.create({
    bookingId: booking._id,
    description,
    estimatedDamage: estimatedDamage || 0,
    deductionAmount: deductionAmount || 0,
    photos: photos || [],
    status: 'reported',
  });

  // Link damage report to booking and adjust refund amount
  booking.damageReportId = damageReport._id;
  booking.depositRefundAmount = booking.depositAmount - (deductionAmount || 0);
  await booking.save();

  await logAudit(
    'damage_report.created',
    'DamageReport',
    damageReport._id,
    req.adminId || 'unknown',
    {
      bookingId: booking.bookingId,
      estimatedDamage,
      deductionAmount,
      adjustedRefund: booking.depositRefundAmount,
    }
  );

  res.status(201).json({
    success: true,
    data: {
      damageReport,
      adjustedDepositRefund: booking.depositRefundAmount,
    },
  });
});
