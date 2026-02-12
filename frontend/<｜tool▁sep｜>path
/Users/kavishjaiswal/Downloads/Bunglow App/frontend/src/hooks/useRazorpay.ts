const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
  return scriptLoading;
}

export interface RazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function openCheckout(
  orderId: string,
  amount: number,
  keyId: string,
  onSuccess: (payload: RazorpaySuccessPayload) => void,
  onFailure: (error: unknown) => void
): void {
  loadScript()
    .then(() => {
      const Razorpay = (window as unknown as { Razorpay: unknown }).Razorpay;
      if (!Razorpay) {
        onFailure(new Error('Razorpay not available'));
        return;
      }
      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        order_id: orderId,
        handler: (response: RazorpaySuccessPayload) => {
          onSuccess(response);
        },
        modal: {
          ondismiss: () => onFailure(new Error('Payment cancelled')),
        },
      };
      const rzp = new (Razorpay as new (opts: typeof options) => { open: () => void })(options);
      rzp.open();
    })
    .catch(onFailure);
}
