// TODO: Implement in Day 7-8 — Email (Resend) + WhatsApp (wa.me links)
// This service will handle:
// - sendBookingConfirmation(booking, customer): Email confirmation to customer
// - sendAdminNotification(booking): Notify admin of new booking (email + WhatsApp link)
// - sendPaymentReceipt(booking, payment): Email payment receipt
// - generateWhatsAppLink(phone, message): Generate wa.me deep link

import { logger } from '../utils/logger';

export const sendBookingConfirmation = async (
  _booking: Record<string, unknown>,
  _customer: Record<string, unknown>
): Promise<void> => {
  logger.warn('notification.service.sendBookingConfirmation is a stub');
};

export const sendAdminNotification = async (
  _booking: Record<string, unknown>
): Promise<void> => {
  logger.warn('notification.service.sendAdminNotification is a stub');
};

export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
