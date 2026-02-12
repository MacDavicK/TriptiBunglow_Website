import mongoose, { Schema, Document, Types } from 'mongoose';
import { HOLD_EXPIRY_SECONDS } from '../utils/constants';

export interface IDateHold extends Document {
  propertyId: Types.ObjectId;
  date: Date;
  bookingId: Types.ObjectId;
  createdAt: Date;
}

const dateHoldSchema = new Schema<IDateHold>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    date: { type: Date, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

dateHoldSchema.index({ createdAt: 1 }, { expireAfterSeconds: HOLD_EXPIRY_SECONDS });
dateHoldSchema.index({ propertyId: 1, date: 1 }, { unique: true });
dateHoldSchema.index({ bookingId: 1 });

export const DateHold = mongoose.model<IDateHold>('DateHold', dateHoldSchema);
