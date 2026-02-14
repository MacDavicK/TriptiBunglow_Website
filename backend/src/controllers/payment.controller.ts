// TODO: Re-enable when Razorpay gateway is activated
// All Razorpay payment controller logic is disabled. Manual UPI payment is currently active.

// import { Request, Response } from 'express';
// import { Booking } from '../models/booking.model';
// import { Payment } from '../models/payment.model';
// import { catchAsync } from '../utils/catch-async';
// import { AppError } from '../utils/app-error';
// import { logAudit } from '../services/audit.service';
// import * as paymentService from '../services/payment.service';
// import * as calendarService from '../services/calendar.service';
// import * as notificationService from '../services/notification.service';
// import { logger } from '../utils/logger';
//
// export const createOrder = catchAsync(async (req: Request, res: Response) => { ... });
// export const verifyPayment = catchAsync(async (req: Request, res: Response) => { ... });
// export const handleWebhook = catchAsync(async (req: Request, res: Response) => { ... });

import { Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';

export const createOrder = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError(
    'Razorpay is disabled. Use manual UPI payment.',
    503,
    'RAZORPAY_DISABLED'
  );
});

export const verifyPayment = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError(
    'Razorpay is disabled. Use manual UPI payment.',
    503,
    'RAZORPAY_DISABLED'
  );
});

export const handleWebhook = catchAsync(async (_req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    error: {
      message: 'Razorpay is disabled. Use manual UPI payment.',
      code: 'RAZORPAY_DISABLED',
    },
  });
});
