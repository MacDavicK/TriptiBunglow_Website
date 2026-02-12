import { Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';

// TODO: Implement in Day 6 — Razorpay integration

export const createOrder = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('Payment integration not yet implemented', 501, 'NOT_IMPLEMENTED');
});

export const verifyPayment = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('Payment integration not yet implemented', 501, 'NOT_IMPLEMENTED');
});

export const handleWebhook = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('Payment integration not yet implemented', 501, 'NOT_IMPLEMENTED');
});
