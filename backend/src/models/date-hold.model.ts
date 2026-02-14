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

// NOTE: If this TTL index was already created with a different value (e.g., 900s),
// MongoDB will silently use the OLD TTL value. You must either:
// 1. Drop the collection: db.dateholds.drop()
// 2. Or drop the specific index: db.dateholds.dropIndex("createdAt_1")
// Then restart the server to recreate it with the new 172800s (48h) TTL.
dateHoldSchema.index({ createdAt: 1 }, { expireAfterSeconds: HOLD_EXPIRY_SECONDS });
dateHoldSchema.index({ propertyId: 1, date: 1 }, { unique: true });
dateHoldSchema.index({ bookingId: 1 });

export const DateHold = mongoose.model<IDateHold>('DateHold', dateHoldSchema);
