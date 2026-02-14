import mongoose, { Schema, Document, Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { BOOKING_STATUS_VALUES, BOOKING_TYPE_VALUES } from '../utils/constants';

export interface IBooking extends Document {
  bookingId: string;
  propertyIds: Types.ObjectId[];
  customerId: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  bookingType: string;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  totalCharged: number;
  depositAmount: number;
  depositRefundAmount?: number;
  damageReportId?: Types.ObjectId;
  googleCalendarEventId?: string;
  consentRecordId?: Types.ObjectId;
  specialRequests?: string;
  guestCount: number;
  reasonForRenting: string;
  termsAcceptedAt: Date;
  termsVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, unique: true },
    propertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property', required: true }],
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    bookingType: { type: String, enum: BOOKING_TYPE_VALUES, required: true },
    status: { type: String, enum: BOOKING_STATUS_VALUES, default: 'hold' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    totalCharged: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    depositRefundAmount: { type: Number },
    damageReportId: { type: Schema.Types.ObjectId, ref: 'DamageReport' },
    googleCalendarEventId: { type: String },
    consentRecordId: { type: Schema.Types.ObjectId, ref: 'ConsentRecord' },
    specialRequests: { type: String },
    guestCount: { type: Number, required: true },
    reasonForRenting: { type: String, required: true, trim: true },
    termsAcceptedAt: { type: Date, required: true },
    termsVersion: { type: String, required: true, default: '1.0' },
  },
  { timestamps: true }
);

bookingSchema.index({ propertyIds: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });

bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = `BK-${nanoid(8)}`;
  }
  next();
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
