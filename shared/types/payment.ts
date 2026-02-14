// TODO: Re-enable when Razorpay gateway is activated
// All Razorpay types are commented out. Manual UPI payment is currently active.

// export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
//
// export interface Payment {
//   _id: string;
//   razorpayOrderId: string;
//   razorpayPaymentId?: string;
//   bookingId: string;
//   amount: number;
//   currency: 'INR';
//   status: PaymentStatus;
//   refunds: PaymentRefund[];
//   createdAt: string;
//   updatedAt: string;
// }
//
// export interface PaymentRefund {
//   refundId: string;
//   amount: number;
//   reason: string;
//   createdAt: string;
// }
//
// export interface CreateOrderRequest {
//   bookingId: string;
// }
//
// export interface CreateOrderResponse {
//   orderId: string;
//   amount: number;
//   currency: 'INR';
//   keyId: string;
// }
//
// export interface VerifyPaymentRequest {
//   razorpay_order_id: string;
//   razorpay_payment_id: string;
//   razorpay_signature: string;
//   bookingId: string;
// }

// Stub types to keep imports compiling
export type PaymentStatus = 'pending' | 'confirmed' | 'refunded';

export interface Payment {
  _id: string;
}

export interface PaymentRefund {
  refundId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  bookingId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: 'INR';
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId: string;
}
