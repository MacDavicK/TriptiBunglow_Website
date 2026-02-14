import type { ApiResponse } from '@shared/types';
import { api } from './api';

export interface PaymentInfo {
  upiId: string;
  qrCodeUrl: string;
  securityDeposit: number;
  instructions: string[];
}

export async function getPaymentInfo(): Promise<PaymentInfo> {
  const { data } = await api.get<ApiResponse<PaymentInfo>>('/payment-info');
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to load payment info');
  }
  return data.data;
}
