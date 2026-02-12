export const BookingStatus = {
  HOLD: 'hold',
  PENDING_APPROVAL: 'pending_approval',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const BOOKING_STATUS_VALUES = Object.values(BookingStatus);

export const BookingType = {
  STANDARD: 'standard',
  SPECIAL: 'special',
} as const;

export const BOOKING_TYPE_VALUES = Object.values(BookingType);

export const PaymentStatus = {
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_STATUS_VALUES = Object.values(PaymentStatus);

export const UserRole = {
  OWNER: 'owner',
  MANAGER: 'manager',
} as const;

export const USER_ROLE_VALUES = Object.values(UserRole);

export const DamageReportStatus = {
  REPORTED: 'reported',
  DEDUCTED: 'deducted',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
} as const;

export const DAMAGE_REPORT_STATUS_VALUES = Object.values(DamageReportStatus);

export const Nationality = {
  INDIAN: 'indian',
  FOREIGN: 'foreign',
} as const;

export const NATIONALITY_VALUES = Object.values(Nationality);

export const IdType = {
  AADHAAR: 'aadhaar',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  VOTER_ID: 'voter_id',
} as const;

export const ID_TYPE_VALUES = Object.values(IdType);

// Monetary values in paise
export const RATE_PER_NIGHT = 2500000; // ₹25,000
export const SECURITY_DEPOSIT = 500000; // ₹5,000
export const HOLD_EXPIRY_SECONDS = 900; // 15 minutes
