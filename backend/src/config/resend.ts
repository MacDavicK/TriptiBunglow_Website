import { Resend } from 'resend';
import { logger } from '../utils/logger';

const apiKey = process.env.RESEND_API_KEY;

let resendClient: Resend | null = null;

if (apiKey) {
  resendClient = new Resend(apiKey);
  logger.info('Resend email client initialized');
} else {
  logger.warn('Resend API key not set — email features disabled');
}

export const resend = resendClient;
export const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
