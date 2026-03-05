import { Customer } from '../models/customer.model';
import { Booking } from '../models/booking.model';
import { logAudit } from '../services/audit.service';
import { logger } from '../utils/logger';
import { sendDataCleanupWarning } from '../services/notification.service';
import { cloudinary } from '../config/cloudinary';

/**
 * Extract Cloudinary public ID from a secure URL.
 * URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{id}.{ext}
 */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryAsset(url: string): Promise<void> {
  if (!cloudinary) return;
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
    logger.info({ publicId }, 'Cloudinary asset deleted');
  } catch (err) {
    logger.error({ err, publicId }, 'Failed to delete Cloudinary asset');
  }
}

/**
 * Daily data cleanup job (DPDP Act 2023 compliance).
 *
 * Phase 1: Send 48-hour warning emails to customers whose retention has expired.
 * Phase 2: Delete ID data for customers warned 48+ hours ago.
 */
export async function runDataCleanup(): Promise<void> {
  const now = new Date();
  logger.info('Data cleanup job started');

  try {
    // Phase 1: Send 48h warning emails
    const customersToWarn = await Customer.find({
      dataRetentionExpiresAt: { $lte: now },
      dataCleanupWarningAt: { $exists: false },
      $or: [
        { aadhaarDocumentUrl: { $ne: null } },
        { idNumber: { $ne: null } },
        { idDocumentUrl: { $ne: null } },
      ],
    });

    for (const customer of customersToWarn) {
      try {
        await sendDataCleanupWarning({
          customerName: customer.name,
          customerEmail: customer.email,
          retentionExpiredAt: customer.dataRetentionExpiresAt,
        });

        customer.dataCleanupWarningAt = now;
        await customer.save();

        await logAudit(
          'customer.data_deletion_warning_sent',
          'Customer',
          customer._id,
          'system:data-cleanup',
          { email: customer.email, retentionExpiredAt: customer.dataRetentionExpiresAt }
        );

        logger.info({ customerId: customer._id }, 'Data cleanup warning sent');
      } catch (err) {
        logger.error({ err, customerId: customer._id }, 'Failed to send cleanup warning — will retry next run');
      }
    }

    // Phase 2: Delete data for customers warned 48+ hours ago
    const warningCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const customersToClean = await Customer.find({
      dataCleanupWarningAt: { $lte: warningCutoff },
      $or: [
        { aadhaarDocumentUrl: { $ne: null } },
        { idNumber: { $ne: null } },
        { idDocumentUrl: { $ne: null } },
      ],
    });

    for (const customer of customersToClean) {
      try {
        logger.info({ customerId: customer._id }, 'Deleting expired ID data (DPDP compliance)');

        // Delete Cloudinary assets
        if (customer.aadhaarDocumentUrl) {
          await deleteCloudinaryAsset(customer.aadhaarDocumentUrl);
        }
        if (customer.idDocumentUrl) {
          await deleteCloudinaryAsset(customer.idDocumentUrl);
        }

        const previousFields = {
          hadAadhaarDoc: Boolean(customer.aadhaarDocumentUrl),
          hadIdDoc: Boolean(customer.idDocumentUrl),
          hadIdNumber: Boolean(customer.idNumber),
        };

        // Null out sensitive fields on Customer
        await Customer.updateOne(
          { _id: customer._id },
          {
            $set: {
              idNumber: null,
              aadhaarDocumentUrl: null,
              idDocumentUrl: null,
            },
            $unset: { dataCleanupWarningAt: '' },
          }
        );

        // Delete additional guest Aadhaar data on all bookings for this customer
        const bookings = await Booking.find({ customerId: customer._id });

        for (const booking of bookings) {
          let modified = false;

          for (const guest of booking.additionalGuests) {
            if (guest.aadhaarDocumentUrl) {
              await deleteCloudinaryAsset(guest.aadhaarDocumentUrl);
              guest.aadhaarDocumentUrl = undefined;
              modified = true;
            }
            if (guest.aadhaarNumber && guest.aadhaarNumber !== '[REDACTED]') {
              guest.aadhaarNumber = '[REDACTED]';
              modified = true;
            }
          }

          if (modified) {
            booking.markModified('additionalGuests');
            await booking.save();

            await logAudit(
              'booking.guest_data_cleaned',
              'Booking',
              booking._id,
              'system:data-cleanup',
              { guestCount: booking.additionalGuests.length }
            );
          }
        }

        await logAudit(
          'customer.data_deleted_dpdp',
          'Customer',
          customer._id,
          'system:data-cleanup',
          { reason: 'DPDP 30-day retention expired', ...previousFields }
        );

        logger.info({ customerId: customer._id }, 'ID data deleted successfully');
      } catch (err) {
        logger.error({ err, customerId: customer._id }, 'Failed to clean customer data — will retry next run');
      }
    }

    logger.info(
      { warned: customersToWarn.length, cleaned: customersToClean.length },
      'Data cleanup job completed'
    );
  } catch (err) {
    logger.error({ err }, 'Data cleanup job failed');
  }
}
