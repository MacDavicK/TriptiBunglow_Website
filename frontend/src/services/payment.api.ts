// TODO: Re-enable when Razorpay gateway is activated
// Manual UPI payment is currently active.

export async function createOrder(_bookingId: string): Promise<never> {
  throw new Error('Razorpay is disabled');
}

export async function verifyPayment(_payload: unknown): Promise<never> {
  throw new Error('Razorpay is disabled');
}
