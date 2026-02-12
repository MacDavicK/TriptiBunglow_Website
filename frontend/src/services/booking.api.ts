import type { ApiResponse } from '@shared/types';
import type { CreateBookingRequest } from '@shared/types';
import { api } from './api';

export interface AvailabilityResponse {
  available: string[];
  unavailable: string[];
}

export async function getAvailability(
  propertyId: string,
  month: number,
  year: number
): Promise<AvailabilityResponse> {
  const { data } = await api.get<ApiResponse<AvailabilityResponse>>('/availability', {
    params: { propertyId, month, year },
  });
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch availability');
  }
  return data.data;
}

export async function createBooking(payload: CreateBookingRequest): Promise<{ bookingId: string }> {
  const { data } = await api.post<ApiResponse<{ bookingId: string }>>('/bookings', payload);
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to create booking');
  }
  return data.data;
}
