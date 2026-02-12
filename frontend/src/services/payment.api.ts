import type { ApiResponse } from '@shared/types';
import type {
  CreateOrderResponse,
  VerifyPaymentRequest,
} from '@shared/types';
import { api } from './api';

export async function createOrder(bookingId: string): Promise<CreateOrderResponse> {
  const { data } = await api.post<ApiResponse<CreateOrderResponse>>('/payments/create-order', {
    bookingId,
  });
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to create order');
  }
  return data.data;
}

export async function verifyPayment(payload: VerifyPaymentRequest): Promise<{ success: boolean }> {
  const { data } = await api.post<ApiResponse<{ success: boolean }>>('/payments/verify', payload);
  if (!data.success) {
    throw new Error(data.error?.message ?? 'Payment verification failed');
  }
  return { success: true };
}
