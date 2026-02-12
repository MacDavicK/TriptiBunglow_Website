import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  slug: string;
  description: string;
  ratePerNight: number;
  securityDeposit: number;
  maxGuests: number;
  amenities: string[];
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '' },
    ratePerNight: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    amenities: [{ type: String }],
    photos: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

propertySchema.index({ slug: 1 }, { unique: true });

export const Property = mongoose.model<IProperty>('Property', propertySchema);
