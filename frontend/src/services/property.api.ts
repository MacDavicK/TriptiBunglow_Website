import type { ApiResponse } from '@shared/types';
import type { Property, PropertyListItem } from '@shared/types';
import { api } from './api';

export async function getProperties(): Promise<Property[] | PropertyListItem[]> {
  const { data } = await api.get<ApiResponse<Property[]>>('/properties');
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch properties');
  }
  return data.data;
}

export async function getProperty(slug: string): Promise<Property> {
  const { data } = await api.get<ApiResponse<Property>>(`/properties/${slug}`);
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch property');
  }
  return data.data;
}
