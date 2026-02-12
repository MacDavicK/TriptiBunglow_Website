import mongoose, { Schema, Document, Types } from 'mongoose';
import { DAMAGE_REPORT_STATUS_VALUES } from '../utils/constants';

export interface IDamageReport extends Document {
  bookingId: Types.ObjectId;
  photos: string[];
  description: string;
  estimatedDamage: number;
  deductionAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const damageReportSchema = new Schema<IDamageReport>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    photos: [{ type: String }],
    description: { type: String, required: true },
    estimatedDamage: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    status: { type: String, enum: DAMAGE_REPORT_STATUS_VALUES, default: 'reported' },
  },
  { timestamps: true }
);

export const DamageReport = mongoose.model<IDamageReport>('DamageReport', damageReportSchema);
