// TODO: Re-enable when Razorpay gateway is activated
// Manual UPI payment is currently active. See payment-info.api.ts

export interface RazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function openCheckout(
  _orderId: string,
  _amount: number,
  _keyId: string,
  _onSuccess: (payload: RazorpaySuccessPayload) => void,
  onFailure: (error: unknown) => void
): void {
  onFailure(new Error('Razorpay is disabled. Use manual UPI payment.'));
}
