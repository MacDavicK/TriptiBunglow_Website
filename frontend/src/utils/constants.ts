export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api';
export const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';

export const PROPERTY_SLUGS = ['bungalow-a', 'bungalow-b'] as const;

export const BOOKING_STATUSES = [
  'hold',
  'pending_approval',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
  'refunded',
] as const;

export type BookingStatusForBadge = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_BADGE_COLORS: Record<
  BookingStatusForBadge,
  'green' | 'amber' | 'blue' | 'purple' | 'gray' | 'red'
> = {
  hold: 'blue',
  pending_approval: 'amber',
  confirmed: 'green',
  checked_in: 'purple',
  checked_out: 'gray',
  cancelled: 'red',
  refunded: 'gray',
};
