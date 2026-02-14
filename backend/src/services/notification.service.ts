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

interface PaymentInfo {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
}

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

/**
 * Send payment receipt email to customer.
 */
export const sendPaymentReceipt = async (
  booking: BookingInfo,
  payment: PaymentInfo,
  customerEmail: string
): Promise<void> => {
  if (!resend) {
    logger.info('Resend not configured — skipping payment receipt email');
    return;
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Payment Receipt</h2>
        <p>Thank you for your payment. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Booking ID</td>
            <td style="padding: 8px 0;">${booking.bookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Order ID</td>
            <td style="padding: 8px 0;">${payment.razorpayOrderId}</td>
          </tr>
          ${payment.razorpayPaymentId ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Payment ID</td>
            <td style="padding: 8px 0;">${payment.razorpayPaymentId}</td>
          </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Amount Paid</td>
            <td style="padding: 8px 0;">${formatRupees(payment.amount)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: bold;">Date</td>
            <td style="padding: 8px 0;">${formatDate(new Date())}</td>
          </tr>
        </table>
        <p style="color: #718096; font-size: 14px;">
          Please keep this email as your payment receipt.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `Payment Receipt — ${booking.bookingId}`,
      html,
    });

    logger.info({ bookingId: booking.bookingId }, 'Payment receipt email sent');
  } catch (err) {
    logger.error({ err, bookingId: booking.bookingId }, 'Failed to send payment receipt email');
  }
};

/**
 * Generate a WhatsApp deep link for contacting a customer.
 */
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
