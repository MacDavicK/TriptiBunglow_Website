import { Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';

// TODO: Implement DPDP data rights endpoints
// These require booking token authentication (not JWT)
// Customers authenticate with bookingId + email combination

export const getMyData = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('DPDP data export not yet implemented', 501, 'NOT_IMPLEMENTED');
});

export const updateMyData = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('DPDP data correction not yet implemented', 501, 'NOT_IMPLEMENTED');
});

export const deleteMyData = catchAsync(async (_req: Request, _res: Response) => {
  throw new AppError('DPDP data erasure not yet implemented', 501, 'NOT_IMPLEMENTED');
});
