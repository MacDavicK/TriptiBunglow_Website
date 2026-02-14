export type BookingStatus =
  | 'hold'
  | 'pending_approval'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'refunded';

export type BookingType = 'standard' | 'special';

export interface Booking {
  _id: string;
  bookingId: string;          // nanoid short ID (e.g., "BK-a3xK9m")
  propertyIds: string[];      // Array of property _ids (1 for standard, 1-2 for special)
  customerId: string;
  checkIn: string;            // ISO 8601 UTC
  checkOut: string;           // ISO 8601 UTC
  nights: number;
  bookingType: BookingType;
  status: BookingStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  totalCharged: number;       // paise
  depositAmount: number;      // paise
  depositRefundAmount?: number; // paise (set after checkout)
  damageReportId?: string;
  googleCalendarEventId?: string;
  consentRecordId?: string;
  specialRequests?: string;
  guestCount: number;
  reasonForRenting: string;
  termsAcceptedAt: string;
  termsVersion: string;
  createdAt: string;
  updatedAt: string;
}

/** Frontend → Backend: create a new booking */
export interface CreateBookingRequest {
  propertyIds: string[];
  checkIn: string;            // ISO date string "2026-03-15"
  checkOut: string;           // ISO date string "2026-03-17"
  bookingType: BookingType;
  guestCount: number;
  specialRequests?: string;
  reasonForRenting: string;
  termsAcceptedAt: string;
  termsVersion: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    nationality: 'indian' | 'foreign';
    idType?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';
    idNumber?: string;
    panNumber?: string;
    aadhaarDocumentUrl?: string;
    panDocumentUrl?: string;
  };
  consent: {
    consentVersion: string;
    purposesConsented: string[];
    consentText: string;
  };
}

/** Lightweight version for listing in admin dashboard */
export interface BookingListItem {
  _id: string;
  bookingId: string;
  propertyIds: string[];
  customerName: string;
  customerPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  bookingType: BookingType;
  status: BookingStatus;
  totalCharged: number;
  createdAt: string;
}
