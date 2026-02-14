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
        'Open any UPI app (Google Pay, PhonePe, Paytm, etc.)',
        `Pay to UPI ID: ${upiId}`,
        'Enter the total booking amount as shown on the booking summary',
        'Take a screenshot of the payment confirmation',
        'Upload the screenshot and enter the UTR/reference number in the booking form',
        'The owner will verify your payment within 24 hours',
      ],
    },
  });
});

export { router as paymentInfoRoutes };
