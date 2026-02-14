import { resend, fromEmail } from '../config/resend';
import { logger } from '../utils/logger';

interface BookingInfo {
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalCharged: number;
  depositAmount: number;
  specialRequests?: string;
  propertyIds: Array<{ name: string }>;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

// TODO: Re-enable when Razorpay gateway is activated
// interface PaymentInfo {
//   razorpayOrderId: string;
//   razorpayPaymentId?: string;
//   amount: number;
// }

/**
 * Format paise to rupees for display.
 */
const formatRupees = (paise: number): string => {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
};

/**
 * Format a date to a human-readable IST string.
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Send booking confirmation email to customer.
 */
export const sendBookingConfirmation = async (
  booking: BookingInfo,
  customer: CustomerInfo
): Promise<void> => {
  if (!resend) {
    logger.info('Resend not configured — skipping booking confirmation email');
    return;
  }

  try {
    const propertyNames = booking.propertyIds.map((p) => p.name).join(', ');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Booking Confirmed!</h2>
        <p>Dear ${customer.name},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Booking ID</td>
            <td style="padding: 8px 0;">${booking.bookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Property</td>
            <td style="padding: 8px 0;">${propertyNames}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Check-in</td>
            <td style="padding: 8px 0;">${formatDate(booking.checkIn)} (2:00 PM)</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Check-out</td>
            <td style="padding: 8px 0;">${formatDate(booking.checkOut)} (11:00 AM)</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Nights</td>
            <td style="padding: 8px 0;">${booking.nights}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Total Charged</td>
            <td style="padding: 8px 0;">${formatRupees(booking.totalCharged)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Security Deposit</td>
            <td style="padding: 8px 0;">${formatRupees(booking.depositAmount)} (refundable)</td>
          </tr>
        </table>
        ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
        <p style="color: #718096; font-size: 14px;">
          If you have any questions, please contact us directly.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: customer.email,
      subject: `Booking Confirmed — ${booking.bookingId}`,
      html,
    });

    logger.info({ bookingId: booking.bookingId, to: customer.email }, 'Booking confirmation email sent');
  } catch (err) {
    logger.error({ err, bookingId: booking.bookingId }, 'Failed to send booking confirmation email');
  }
};

/**
 * Send notification email to admin about a new booking.
 * Includes a WhatsApp link to contact the customer.
 */
export const sendAdminNotification = async (
  booking: BookingInfo,
  customer: CustomerInfo
): Promise<void> => {
  if (!resend) {
    logger.info('Resend not configured — skipping admin notification email');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.info('ADMIN_EMAIL not configured — skipping admin notification');
    return;
  }

  try {
    const propertyNames = booking.propertyIds.map((p) => p.name).join(', ');
    const whatsappLink = generateWhatsAppLink(
      customer.phone,
      `Hi ${customer.name}, this is regarding your booking ${booking.bookingId} at our bungalow.`
    );

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">New Booking Confirmed</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Booking ID</td>
            <td style="padding: 8px 0;">${booking.bookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Guest</td>
            <td style="padding: 8px 0;">${customer.name} (${customer.phone})</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Property</td>
            <td style="padding: 8px 0;">${propertyNames}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Check-in</td>
            <td style="padding: 8px 0;">${formatDate(booking.checkIn)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Check-out</td>
            <td style="padding: 8px 0;">${formatDate(booking.checkOut)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Total</td>
            <td style="padding: 8px 0;">${formatRupees(booking.totalCharged)}</td>
          </tr>
        </table>
        <p>
          <a href="${whatsappLink}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 4px;">
            Contact Guest on WhatsApp
          </a>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Booking — ${booking.bookingId} (${customer.name})`,
      html,
    });

    logger.info({ bookingId: booking.bookingId }, 'Admin notification email sent');
  } catch (err) {
    logger.error({ err, bookingId: booking.bookingId }, 'Failed to send admin notification email');
  }
};

// TODO: Re-enable when Razorpay gateway is activated
// export const sendPaymentReceipt = async (
//   booking: BookingInfo,
//   payment: PaymentInfo,
//   customerEmail: string
// ): Promise<void> => { ... };

/**
 * Send "booking received, awaiting payment confirmation" email to customer.
 * Sent immediately after a standard booking is created with status pending_payment.
 */
export const sendBookingPendingEmail = async (info: {
  bookingId: string;
  customerName: string;
  customerEmail: string;
}): Promise<void> => {
  if (!resend) {
    logger.info('Resend not configured — skipping pending booking email');
    return;
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Booking Received — Awaiting Payment Confirmation</h2>
        <p>Dear ${info.customerName},</p>
        <p>Thank you for your booking request. Your booking ID is <strong>${info.bookingId}</strong>.</p>
        <p>We have received your details and security deposit payment information. The property owner is now verifying your payment.</p>
        <p><strong>What happens next:</strong></p>
        <ul>
          <li>The owner will verify your UPI payment within <strong>24 hours</strong>.</li>
          <li>You will receive a <strong>confirmation email</strong> once your payment is verified and booking is confirmed.</li>
          <li>If you do not receive confirmation within 48 hours, please contact us directly.</li>
        </ul>
        <p>Please do not make any duplicate payments. If there is an issue with your payment, we will reach out to you.</p>
        <p style="color: #718096; font-size: 14px; margin-top: 24px;">
          Thank you for choosing Tripti & Spandan Bungalow.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: info.customerEmail,
      subject: `Booking ${info.bookingId} — Awaiting Payment Confirmation`,
      html,
    });

    logger.info({ bookingId: info.bookingId, to: info.customerEmail }, 'Pending booking email sent to customer');
  } catch (err) {
    logger.error({ err, bookingId: info.bookingId }, 'Failed to send pending booking email');
  }
};

/**
 * Send detailed new-booking alert to admin.
 * Includes ALL guest details: name, phone, email, reason for booking,
 * duration of stay, which bungalow(s), booking type, special requirements.
 * Sent immediately after any booking is created.
 */
export const sendAdminNewBookingAlert = async (info: {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyNames: string[];
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestCount: number;
  reasonForRenting: string;
  bookingType: string;
  specialRequests?: string;
  totalCharged: number;
  depositAmount: number;
}): Promise<void> => {
  if (!resend) {
    logger.info('Resend not configured — skipping admin new booking alert');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.info('ADMIN_EMAIL not configured — skipping admin alert');
    return;
  }

  try {
    const propertyList = info.propertyNames.join(' & ');
    const bungalowLabel = info.propertyNames.length === 2
      ? 'Both Bungalows'
      : info.propertyNames[0] || 'Unknown';

    const whatsappLink = generateWhatsAppLink(
      info.customerPhone,
      `Hi ${info.customerName}, this is regarding your booking ${info.bookingId} at our bungalow.`
    );

    const bookingTypeLabel = info.bookingType === 'special'
      ? 'Special Event (Wedding / Party / Function)'
      : 'Standard Stay';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">New Booking Request</h2>
        <p style="font-size: 14px; color: #718096;">
          Someone wants to book your bungalow. Their payment is awaiting your confirmation.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold; width: 40%;">Booking ID</td>
            <td style="padding: 10px 0;">${info.bookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f7fafc;">
            <td style="padding: 10px 0; font-weight: bold;">Guest Name</td>
            <td style="padding: 10px 0;">${info.customerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold;">Phone</td>
            <td style="padding: 10px 0;">${info.customerPhone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f7fafc;">
            <td style="padding: 10px 0; font-weight: bold;">Email</td>
            <td style="padding: 10px 0;">${info.customerEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold;">Bungalow(s)</td>
            <td style="padding: 10px 0;">${bungalowLabel} (${propertyList})</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f7fafc;">
            <td style="padding: 10px 0; font-weight: bold;">Check-in</td>
            <td style="padding: 10px 0;">${formatDate(info.checkIn)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold;">Check-out</td>
            <td style="padding: 10px 0;">${formatDate(info.checkOut)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f7fafc;">
            <td style="padding: 10px 0; font-weight: bold;">Duration</td>
            <td style="padding: 10px 0;">${info.nights} night(s)</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold;">Total Guests</td>
            <td style="padding: 10px 0;">${info.guestCount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f7fafc;">
            <td style="padding: 10px 0; font-weight: bold;">Booking Type</td>
            <td style="padding: 10px 0;">${bookingTypeLabel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold;">Reason for Renting</td>
            <td style="padding: 10px 0;">${info.reasonForRenting}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f7fafc;">
            <td style="padding: 10px 0; font-weight: bold;">Total Amount</td>
            <td style="padding: 10px 0;">${formatRupees(info.totalCharged)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; font-weight: bold;">Security Deposit</td>
            <td style="padding: 10px 0;">${formatRupees(info.depositAmount)}</td>
          </tr>
          ${info.specialRequests ? `
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fffaf0;">
            <td style="padding: 10px 0; font-weight: bold;">Special Requests</td>
            <td style="padding: 10px 0;">${info.specialRequests}</td>
          </tr>
          ` : ''}
        </table>
        <p style="margin-top: 16px;">
          <a href="${whatsappLink}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Contact Guest on WhatsApp
          </a>
        </p>
        <p style="color: #718096; font-size: 13px; margin-top: 24px;">
          Log in to the admin dashboard to verify the UPI payment and confirm this booking.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Booking — ${info.bookingId} | ${info.customerName} | ${bungalowLabel} | ${info.reasonForRenting}`,
      html,
    });

    logger.info({ bookingId: info.bookingId }, 'Admin new booking alert sent');
  } catch (err) {
    logger.error({ err, bookingId: info.bookingId }, 'Failed to send admin new booking alert');
  }
};

/**
 * Generate a WhatsApp deep link for contacting a customer.
 */
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
