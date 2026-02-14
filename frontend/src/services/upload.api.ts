import type { ApiResponse } from '@shared/types';
import { api } from './api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.webp,.pdf';

export async function uploadDocument(
  file: File,
  type: 'aadhaar' | 'pan'
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', type);
  const { data } = await api.post<ApiResponse<{ url: string; publicId: string }>>(
    '/upload/document',
    formData
  );
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Upload failed');
  }
  return data.data;
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function getMaxFileSizeMB(): number {
  return MAX_FILE_SIZE / (1024 * 1024);
}
