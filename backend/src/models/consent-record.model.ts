import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConsentRecord extends Document {
  customerId: Types.ObjectId;
  consentVersion: string;
  purposesConsented: string[];
  consentText: string;
  ipAddress: string;
  userAgent: string;
  consentGivenAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const consentRecordSchema = new Schema<IConsentRecord>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    consentVersion: { type: String, required: true },
    purposesConsented: [{ type: String }],
    consentText: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    consentGivenAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ConsentRecord = mongoose.model<IConsentRecord>('ConsentRecord', consentRecordSchema);
