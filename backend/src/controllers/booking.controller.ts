import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/booking.model';
import { Customer } from '../models/customer.model';
import { ConsentRecord } from '../models/consent-record.model';
import { Property } from '../models/property.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { RATE_PER_NIGHT, SECURITY_DEPOSIT } from '../utils/constants';
import { createDateHolds, releaseDateHolds } from '../services/availability.service';
import { encrypt } from '../services/encryption.service';
import { logAudit } from '../services/audit.service';

export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const {
    propertyIds,
    checkIn,
    checkOut,
    bookingType,
    guestCount,
    specialRequests,
    customer: customerData,
    consent: consentData,
    reasonForRenting,
    termsAcceptedAt,
    termsVersion,
  } = req.body;

  // Validate properties exist
  const properties = await Property.find({
    _id: { $in: propertyIds },
    isActive: true,
  });

  if (properties.length !== propertyIds.length) {
    throw new AppError('One or more properties not found or inactive', 400, 'INVALID_PROPERTY');
  }

  // Calculate dates and pricing
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalCharged = RATE_PER_NIGHT * nights * propertyIds.length + SECURITY_DEPOSIT;
  const depositAmount = SECURITY_DEPOSIT;

  // Encrypt sensitive fields if provided
  let encryptedIdNumber: string | undefined;
  if (customerData.idNumber) {
    encryptedIdNumber = encrypt(customerData.idNumber);
  }
  let encryptedPanNumber: string | undefined;
  if (customerData.panNumber) {
    encryptedPanNumber = encrypt(customerData.panNumber);
  }

  // Create customer
  const dataRetentionExpiresAt = new Date();
  dataRetentionExpiresAt.setFullYear(dataRetentionExpiresAt.getFullYear() + 3);

  const customer = await Customer.create({
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
    nationality: customerData.nationality,
    idType: customerData.idType,
    idNumber: encryptedIdNumber,
    panNumber: encryptedPanNumber,
    aadhaarDocumentUrl: customerData.aadhaarDocumentUrl,
    panDocumentUrl: customerData.panDocumentUrl,
    dataRetentionExpiresAt,
  });

  // Create consent record
  const consentRecord = await ConsentRecord.create({
    customerId: customer._id,
    consentVersion: consentData.consentVersion,
    purposesConsented: consentData.purposesConsented,
    consentText: consentData.consentText,
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
  });

  // Determine initial status based on booking type
  const initialStatus = bookingType === 'standard' ? 'hold' : 'pending_approval';

  // Create booking
  const booking = await Booking.create({
    propertyIds,
    customerId: customer._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    bookingType,
    status: initialStatus,
    totalCharged,
    depositAmount,
    consentRecordId: consentRecord._id,
    specialRequests,
    guestCount,
    reasonForRenting,
    termsAcceptedAt: new Date(termsAcceptedAt),
    termsVersion,
  });

  // Create date holds (prevents double-booking via unique constraint)
  // If this fails with 409, the booking and customer are orphaned but holds are the
  // authoritative source of truth for availability. Orphaned records are harmless.
  try {
    await createDateHolds(propertyIds, checkInDate, checkOutDate, booking._id);
  } catch (err) {
    // Clean up the booking if date holds fail
    await Booking.deleteOne({ _id: booking._id });
    await ConsentRecord.deleteOne({ _id: consentRecord._id });
    await Customer.deleteOne({ _id: customer._id });
    throw err;
  }

  await logAudit(
    'booking.created',
    'Booking',
    booking._id,
    'customer',
    { bookingType, nights, propertyCount: propertyIds.length }
  );

  res.status(201).json({
    success: true,
    data: {
      bookingId: booking.bookingId,
      status: booking.status,
      totalCharged: booking.totalCharged,
      depositAmount: booking.depositAmount,
      nights: booking.nights,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    },
  });
});
