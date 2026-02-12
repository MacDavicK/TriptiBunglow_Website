// TODO: Implement in Day 7 — Google Calendar integration
// This service will handle:
// - createEvent(booking): Create a Google Calendar event for a confirmed booking
// - updateEvent(eventId, booking): Update event details
// - deleteEvent(eventId): Delete event on cancellation

import { logger } from '../utils/logger';

export const createCalendarEvent = async (
  _booking: Record<string, unknown>
): Promise<string | null> => {
  logger.warn('calendar.service.createCalendarEvent is a stub — implement with Google Calendar API');
  return null;
};

export const deleteCalendarEvent = async (
  _eventId: string
): Promise<void> => {
  logger.warn('calendar.service.deleteCalendarEvent is a stub — implement with Google Calendar API');
};
