import { Request, Response } from 'express';
import { Property } from '../models/property.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';

export const listProperties = catchAsync(async (_req: Request, res: Response) => {
  const properties = await Property.find({ isActive: true })
    .select('name slug ratePerNight maxGuests photos amenities')
    .lean();

  res.json({
    success: true,
    data: properties,
  });
});

export const getProperty = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const property = await Property.findOne({ slug, isActive: true }).lean();

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  res.json({
    success: true,
    data: property,
  });
});
