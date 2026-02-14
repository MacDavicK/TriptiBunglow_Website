import { Request, Response } from 'express';
import { Booking } from '../models/booking.model';
import { Customer } from '../models/customer.model';
import { ConsentRecord } from '../models/consent-record.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { decrypt } from '../services/encryption.service';
import { logAudit } from '../services/audit.service';

/**
 * Authenticate a customer using bookingId + email.
 * Returns the booking (populated with customer) if valid.
 */
const authenticateCustomer = async (bookingId: string, email: string) => {
  const booking = await Booking.findOne({ bookingId }).populate('customerId');
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }

  const customer = booking.customerId as any;
  if (!customer || customer.email.toLowerCase() !== email.toLowerCase()) {
    throw new AppError('Invalid credentials', 403, 'FORBIDDEN');
  }

  return { booking, customer };
};

/**
 * Mask an ID number for display — show only last 4 characters.
 */
const maskIdNumber = (encryptedId: string): string => {
  try {
    const decrypted = decrypt(encryptedId);
    if (decrypted.length <= 4) {
      return '****';
    }
    return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
  } catch {
    return '****';
  }
};

/**
 * GET /api/customer/my-data
 * DPDP Act: Data export — return customer's personal data.
 */
export const getMyData = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.query.bookingId as string;
  const email = req.query.email as string;

  const { booking, customer } = await authenticateCustomer(bookingId, email);

  // Fetch consent record
  const consentRecord = booking.consentRecordId
    ? await ConsentRecord.findById(booking.consentRecordId).lean()
    : null;

  res.json({
    success: true,
    data: {
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        nationality: customer.nationality,
        idType: customer.idType || null,
        idNumber: customer.idNumber ? maskIdNumber(customer.idNumber) : null,
      },
      booking: {
        bookingId: booking.bookingId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        status: booking.status,
        totalCharged: booking.totalCharged,
        depositAmount: booking.depositAmount,
        guestCount: booking.guestCount,
      },
      consent: consentRecord
        ? {
            consentVersion: consentRecord.consentVersion,
            purposesConsented: consentRecord.purposesConsented,
            consentedAt: consentRecord.createdAt,
          }
        : null,
      dataRetentionExpiresAt: customer.dataRetentionExpiresAt,
    },
  });
});

/**
 * PATCH /api/customer/my-data
 * DPDP Act: Data correction — update name and/or phone.
 */
export const updateMyData = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, email, updates } = req.body;

  const { customer } = await authenticateCustomer(bookingId, email);

  // Only allow name and phone corrections
  const allowedUpdates: Record<string, string> = {};
  if (updates.name) allowedUpdates.name = updates.name;
  if (updates.phone) allowedUpdates.phone = updates.phone;

  if (Object.keys(allowedUpdates).length === 0) {
    throw new AppError('No valid fields to update. Only name and phone can be corrected.', 400, 'NO_UPDATES');
  }

  await Customer.updateOne({ _id: customer._id }, allowedUpdates);

  await logAudit(
    'customer.data_updated',
    'Customer',
    customer._id,
    'customer',
    { fields: Object.keys(allowedUpdates) }
  );

  res.json({
    success: true,
    message: 'Your data has been updated successfully.',
    data: {
      updatedFields: Object.keys(allowedUpdates),
    },
  });
});

/**
 * DELETE /api/customer/my-data
 * DPDP Act: Data erasure — anonymize personal data but retain booking/payment records.
 */
export const deleteMyData = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, email } = req.body;

  const { customer } = await authenticateCustomer(bookingId, email);

  // Anonymize the customer record — retain booking and payment records for legal purposes.
  // Clear all PII including address, panNumber, and document URLs for DPDP compliance.
  await Customer.updateOne(
    { _id: customer._id },
    {
      $set: {
        name: 'Deleted User',
        email: `deleted-${customer._id}@anonymized.local`,
        phone: '0000000000',
        address: '[Anonymized]', // Required field; overwrite with placeholder
        nationality: customer.nationality, // Retain for legal compliance
      },
      $unset: {
        idNumber: 1,
        idDocumentUrl: 1,
        panNumber: 1,
        aadhaarDocumentUrl: 1,
        panDocumentUrl: 1,
      },
    }
  );

  await logAudit(
    'customer.data_deleted',
    'Customer',
    customer._id,
    'customer',
    { originalEmail: email }
  );

  res.json({
    success: true,
    message: 'Your personal data has been anonymized. Booking and payment records are retained as required by law.',
  });
});
