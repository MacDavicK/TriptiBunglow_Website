import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/payment-info
 * Returns UPI payment details so the frontend can display the QR code and instructions.
 */
router.get('/payment-info', (_req: Request, res: Response) => {
  const upiId = process.env.UPI_ID;
  const upiQrCodeUrl = process.env.UPI_QR_CODE_URL;

  if (!upiId) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'UPI payment info not configured. Contact the property owner.',
        code: 'UPI_NOT_CONFIGURED',
      },
    });
  }

  res.json({
    success: true,
    data: {
      upiId,
      upiQrCodeUrl: upiQrCodeUrl || null,
      instructions: [
        'Scan the QR code or use the UPI ID above to pay the security deposit via any UPI app (Google Pay, PhonePe, Paytm, etc.).',
        'Security deposit: ₹5,000 per bungalow. If booking both bungalows, pay ₹10,000.',
        'The remaining stay amount is payable at check-in.',
        'After payment, enter the UTR/Reference number from your UPI app below.',
        'Optionally upload a screenshot of the payment confirmation for faster verification.',
        'Your booking will be confirmed once the property owner verifies the payment (usually within 24 hours).',
      ],
    },
  });
});

export { router as paymentInfoRoutes };
