import mongoose, { Schema, Document } from 'mongoose';
import { NATIONALITY_VALUES, ID_TYPE_VALUES } from '../utils/constants';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  idType?: string;
  idNumber?: string;
  panNumber?: string;
  aadhaarDocumentUrl?: string;
  panDocumentUrl?: string;
  idDocumentUrl?: string;
  dataRetentionExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    nationality: { type: String, enum: NATIONALITY_VALUES, required: true },
    idType: { type: String, enum: ID_TYPE_VALUES },
    idNumber: { type: String },
    panNumber: { type: String },
    aadhaarDocumentUrl: { type: String },
    panDocumentUrl: { type: String },
    idDocumentUrl: { type: String },
    dataRetentionExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
