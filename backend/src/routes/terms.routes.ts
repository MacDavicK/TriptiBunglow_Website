import { Router, Request, Response } from 'express';

const router = Router();

const TERMS_AND_CONDITIONS = {
  version: '1.2',
  effectiveDate: '2026-03-05',
  title: 'Terms and Conditions – Tripti Bungalow (No. 14 & 15)',
  consentStatement:
    'I have read and agree to the Terms and Conditions. I consent to the collection and processing of my personal data (Aadhaar, contact details) for booking verification and legal compliance under the Digital Personal Data Protection Act, 2023.',
  rules: [
    {
      id: 1,
      text: 'A minimum of 2 valid Aadhaar card copies (UID and VID clearly visible) are required at the time of booking — one from the primary guest and at least one from an additional guest. Foreign nationals must provide a valid passport. Your Aadhaar data (number and uploaded document) will be automatically deleted 30 days after your check-out date, in compliance with the Digital Personal Data Protection Act, 2023.',
    },
    {
      id: 2,
      text: 'Loud music, DJs, and amplified sound systems must be switched off by 10:00 PM. Quiet hours are strictly enforced from 10:00 PM to 8:00 AM.',
    },
    {
      id: 3,
      text: 'Firecrackers, sky lanterns, and any form of pyrotechnics are strictly prohibited on the property and in surrounding areas.',
    },
    {
      id: 4,
      text: 'All furniture, fixtures, and equipment must remain in their designated positions. Do not drag, rearrange, or move furniture outdoors without prior permission. Damage caused by mishandling will be charged.',
    },
    {
      id: 5,
      text: 'A refundable security deposit of ₹5,000 is collected at booking. It will be refunded within 7 days of check-out, less any deductions for damages, missing items, or rule violations.',
    },
    {
      id: 6,
      text: 'Bonfires are permitted only in designated areas and only with prior approval from the owner. Open flames elsewhere on the property are strictly prohibited.',
    },
    {
      id: 7,
      text: 'The property is monitored by CCTV cameras in common outdoor areas for security purposes. Cameras do not cover private rooms or bathrooms.',
    },
    {
      id: 8,
      text: 'The management is not responsible for theft or loss of personal belongings. Guests are advised to keep valuables secure at all times.',
    },
    {
      id: 9,
      text: 'Consumption, possession, or distribution of illegal drugs or narcotics is strictly prohibited. Violation will result in immediate eviction without refund and may be reported to authorities.',
    },
    {
      id: 10,
      text: 'Hookah and smoking are permitted only in designated outdoor areas. Smoking indoors will attract a deep-cleaning surcharge of ₹2,000.',
    },
    {
      id: 11,
      text: 'Alcohol consumption is permitted for guests of legal drinking age. Guests must carry a valid liquor permit if required by Maharashtra state law. The management is not responsible for any legal consequences arising from alcohol consumption.',
    },
    {
      id: 12,
      text: 'Use of the kitchen and cooking equipment is allowed only with prior permission. Guests are responsible for cleaning up after use. Additional charges may apply for excessive mess or damage to kitchen equipment.',
    },
    {
      id: 13,
      text: 'Check-in is at 2:00 PM; check-out is at 11:00 AM. Early check-in or late check-out is subject to availability and may incur additional charges.',
    },
    {
      id: 14,
      text: 'By confirming the booking, the guest consents to the collection and processing of personal data (Aadhaar, name, contact details) for booking verification and legal compliance, in accordance with the Digital Personal Data Protection Act, 2023. Identity documents and Aadhaar data are retained for 30 days after check-out and then automatically deleted. You will receive an email notification 48 hours before deletion. Booking records (without ID data) are retained for 3 years for tax and accounting purposes. The guest may request access to, correction of, or deletion of their data by contacting the property manager.',
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
