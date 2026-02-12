import { google, calendar_v3 } from 'googleapis';
import { logger } from '../utils/logger';

const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
const calendarId = process.env.GOOGLE_CALENDAR_ID;

let calendarClient: calendar_v3.Calendar | null = null;
let googleCalendarId: string | null = null;

if (serviceAccountPath && calendarId) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    calendarClient = google.calendar({ version: 'v3', auth });
    googleCalendarId = calendarId;
    logger.info('Google Calendar client initialized');
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Google Calendar client');
  }
} else {
  logger.warn('Google Calendar env vars not set — calendar sync disabled');
}

export { calendarClient as googleCalendar, googleCalendarId };
