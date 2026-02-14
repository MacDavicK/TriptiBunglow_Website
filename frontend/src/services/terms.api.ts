import type { ApiResponse } from '@shared/types';
import { api } from './api';

export interface TermsRule {
  id: number;
  text: string;
}

export interface TermsAndConditionsData {
  version: string;
  effectiveDate: string;
  title: string;
  rules: TermsRule[];
}

export async function getTermsAndConditions(): Promise<TermsAndConditionsData> {
  const { data } = await api.get<ApiResponse<TermsAndConditionsData>>('/terms-and-conditions');
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch terms and conditions');
  }
  return data.data;
}
