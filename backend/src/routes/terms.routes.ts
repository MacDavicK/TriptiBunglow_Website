import { Router, Request, Response } from 'express';

const router = Router();

const TERMS_AND_CONDITIONS = {
  version: '1.0',
  effectiveDate: '2025-01-01',
  title: 'Terms and Conditions – Tripti & Spandan Bungalow',
  rules: [
    {
      id: 1,
      text: 'Check-in is at 2:00 PM; check-out is at 11:00 AM. Early check-in or late check-out is subject to availability and may incur charges.',
    },
    {
      id: 2,
      text: 'A security deposit of ₹5,000 is collected at booking and refunded within 7 days of check-out, less any deductions for damages.',
    },
    {
      id: 3,
      text: 'Guests must carry a valid government-issued photo ID (Aadhaar, Passport, Driving Licence, or Voter ID). Foreign nationals must carry a passport.',
    },
    {
      id: 4,
      text: 'Maximum occupancy must not exceed the number declared at booking. Additional guests require prior approval and may incur extra charges.',
    },
    {
      id: 5,
      text: 'Loud music, parties, or any activity that disturbs neighbours is strictly prohibited after 10:00 PM.',
    },
    {
      id: 6,
      text: 'Smoking is allowed only in designated outdoor areas. Smoking indoors will attract a cleaning surcharge.',
    },
    {
      id: 7,
      text: 'Pets are not allowed unless expressly approved in writing at the time of booking.',
    },
    {
      id: 8,
      text: 'The guest is liable for any damage to the property, furnishings, or equipment during the stay. Costs will be deducted from the security deposit; excess amounts will be billed separately.',
    },
    {
      id: 9,
      text: 'Illegal activities of any kind are strictly prohibited on the premises.',
    },
    {
      id: 10,
      text: 'The management reserves the right to terminate a booking without refund if these terms are violated.',
    },
    {
      id: 11,
      text: 'Cancellations made more than 48 hours before check-in receive a full refund. Cancellations within 48 hours are non-refundable.',
    },
    {
      id: 12,
      text: 'By confirming the booking, the guest consents to the collection and processing of personal data as described in our Privacy Policy, in accordance with the Digital Personal Data Protection Act, 2023.',
    },
    {
      id: 13,
      text: 'Personal data (name, ID, contact details) is retained for 3 years after check-out for legal compliance, after which it is automatically anonymised.',
    },
    {
      id: 14,
      text: 'The guest may request access to, correction of, or deletion of their personal data at any time by contacting the property manager.',
    },
  ],
};

// GET /api/terms-and-conditions
router.get('/terms-and-conditions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: TERMS_AND_CONDITIONS,
  });
});

export { router as termsRoutes };
