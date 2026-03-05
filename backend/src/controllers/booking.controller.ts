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
import { sendBookingPendingEmail, sendAdminNewBookingAlert, sendBookingFailureAlert } from '../services/notification.service';
import { logger } from '../utils/logger';

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
    additionalGuests,
    upiReference,
    paymentScreenshotUrl,
  } = req.body;

  // Validate all propertyIds are valid 24-char hex ObjectIds
  const { Types } = mongoose;
  for (const pid of propertyIds) {
    if (!Types.ObjectId.isValid(pid) || String(new Types.ObjectId(pid)) !== String(pid)) {
      throw new AppError(
        `Invalid property ID: "${pid}". Please refresh the page and try again.`,
        400,
        'INVALID_PROPERTY_ID'
      );
    }
  }

  const propertyObjectIds = (propertyIds as string[]).map((id: string) => new Types.ObjectId(id));

  try {
    const properties = await Property.find({
      _id: { $in: propertyObjectIds },
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

    // Encrypt primary guest's Aadhaar number
    let encryptedIdNumber: string | undefined;
    if (customerData.idNumber) {
      encryptedIdNumber = encrypt(customerData.idNumber);
    }

    // Encrypt each additional guest's Aadhaar number
    const encryptedAdditionalGuests = additionalGuests.map(
      (guest: { name: string; aadhaarNumber: string; aadhaarDocumentUrl?: string }) => ({
        name: guest.name,
        aadhaarNumber: encrypt(guest.aadhaarNumber),
        aadhaarDocumentUrl: guest.aadhaarDocumentUrl,
      })
    );

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
      aadhaarDocumentUrl: customerData.aadhaarDocumentUrl,
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

    // Standard bookings → pending_payment (await manual UPI confirmation)
    // Special bookings → pending_approval (admin must approve first)
    const initialStatus = bookingType === 'standard' ? 'pending_payment' : 'pending_approval';

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
      additionalGuests: encryptedAdditionalGuests,
      upiReference,
      paymentScreenshotUrl,
    });

    // Create date holds (prevents double-booking via unique constraint)
    try {
      await createDateHolds(propertyIds, checkInDate, checkOutDate, booking._id);
    } catch (err) {
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

    const propertyNames = properties.map((p: any) => p.name);

    sendBookingPendingEmail({
      bookingId: booking.bookingId,
      customerName: customerData.name,
      customerEmail: customerData.email,
    }).catch((err) => logger.error({ err }, 'Failed to send pending email to customer'));

    sendAdminNewBookingAlert({
      bookingId: booking.bookingId,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      propertyNames,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      guestCount,
      reasonForRenting,
      bookingType,
      specialRequests,
      totalCharged,
      depositAmount,
    }).catch((err) => logger.error({ err }, 'Failed to send admin alert email'));

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
  } catch (error) {
    if (upiReference) {
      const sanitizedPayload = { ...req.body };
      if (sanitizedPayload.customer) {
        sanitizedPayload.customer = { ...sanitizedPayload.customer, idNumber: '[REDACTED]' };
      }
      if (sanitizedPayload.additionalGuests) {
        sanitizedPayload.additionalGuests = sanitizedPayload.additionalGuests.map(
          (g: any) => ({ ...g, aadhaarNumber: '[REDACTED]' })
        );
      }

      sendBookingFailureAlert({
        customerName: req.body.customer?.name,
        customerEmail: req.body.customer?.email,
        customerPhone: req.body.customer?.phone,
        upiReference,
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        rawPayload: JSON.stringify(sanitizedPayload),
      }).catch((alertErr) => {
        logger.error({ alertErr }, 'Failed to send booking failure alert');
      });
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'We encountered an issue saving your booking. If you already made a UPI payment, don\'t worry — our team has been notified and will contact you within 24 hours to process your booking or refund.',
      500,
      'BOOKING_SAVE_FAILED'
    );
  }
});
