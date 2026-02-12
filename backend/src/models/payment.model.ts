import mongoose, { Schema, Document, Types } from 'mongoose';
import { PAYMENT_STATUS_VALUES } from '../utils/constants';

export interface IPaymentRefund {
  refundId: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface IWebhookEvent {
  event: string;
  payload: Record<string, unknown>;
  receivedAt: Date;
}

export interface IPayment extends Document {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  bookingId: Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  refunds: IPaymentRefund[];
  webhookEvents: IWebhookEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const paymentRefundSchema = new Schema<IPaymentRefund>(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: PAYMENT_STATUS_VALUES, default: 'created' },
    refunds: [paymentRefundSchema],
    webhookEvents: [webhookEventSchema],
  },
  { timestamps: true }
);

paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
