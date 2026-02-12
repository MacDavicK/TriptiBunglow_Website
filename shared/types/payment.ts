export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface Payment {
  _id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  bookingId: string;
  amount: number;             // paise
  currency: 'INR';
  status: PaymentStatus;
  refunds: PaymentRefund[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRefund {
  refundId: string;
  amount: number;             // paise
  reason: string;
  createdAt: string;
}

/** Frontend → Backend: create a Razorpay order */
export interface CreateOrderRequest {
  bookingId: string;
}

/** Backend → Frontend: Razorpay order details for checkout */
export interface CreateOrderResponse {
  orderId: string;            // Razorpay order_id
  amount: number;             // paise
  currency: 'INR';
  keyId: string;              // Razorpay key_id (public, safe for frontend)
}

/** Frontend → Backend: verify payment after Razorpay checkout */
export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId: string;
}
