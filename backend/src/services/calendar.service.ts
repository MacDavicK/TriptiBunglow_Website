import { googleCalendar, googleCalendarId } from '../config/google-calendar';
import { Booking } from '../models/booking.model';
import { logger } from '../utils/logger';

interface PopulatedBooking {
  _id: any;
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  specialRequests?: string;
  propertyIds: Array<{ name: string; slug: string }>;
  customerId?: { name: string; phone: string };
}

/**
 * Create a Google Calendar event for a confirmed booking.
 * Check-in at 14:00 IST, Check-out at 11:00 IST.
 */
export const createCalendarEvent = async (
  booking: PopulatedBooking
): Promise<string | null> => {
  if (!googleCalendar || !googleCalendarId) {
    logger.info('Google Calendar not configured — skipping event creation');
    return null;
  }

  try {
    const propertyNames = booking.propertyIds
      .map((p) => p.name)
      .join(', ');

    const checkInDate = new Date(booking.checkIn).toISOString().split('T')[0];
    const checkOutDate = new Date(booking.checkOut).toISOString().split('T')[0];

    const description = [
      `Booking ID: ${booking.bookingId}`,
      `Guest Count: ${booking.guestCount}`,
      `Properties: ${propertyNames}`,
      booking.customerId ? `Guest: ${booking.customerId.name}` : '',
      booking.customerId ? `Phone: ${booking.customerId.phone}` : '',
      booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const event = await googleCalendar.events.insert({
      calendarId: googleCalendarId,
      requestBody: {
        summary: `Booking ${booking.bookingId} — ${propertyNames}`,
        description,
        start: {
          dateTime: `${checkInDate}T14:00:00+05:30`,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: `${checkOutDate}T11:00:00+05:30`,
          timeZone: 'Asia/Kolkata',
        },
      },
    });

    const eventId = event.data.id;

    if (eventId) {
      // Save the calendar event ID to the booking
      await Booking.updateOne(
        { _id: booking._id },
        { googleCalendarEventId: eventId }
      );
      logger.info({ bookingId: booking.bookingId, eventId }, 'Calendar event created');
    }

    return eventId || null;
  } catch (err) {
    logger.error({ err, bookingId: booking.bookingId }, 'Failed to create calendar event');
    return null;
  }
};

/**
 * Delete a Google Calendar event (e.g. on cancellation).
 */
export const deleteCalendarEvent = async (
  eventId: string
): Promise<void> => {
  if (!googleCalendar || !googleCalendarId) {
    logger.info('Google Calendar not configured — skipping event deletion');
    return;
  }

  try {
    await googleCalendar.events.delete({
      calendarId: googleCalendarId,
      eventId,
    });
    logger.info({ eventId }, 'Calendar event deleted');
  } catch (err) {
    logger.error({ err, eventId }, 'Failed to delete calendar event');
  }
};
