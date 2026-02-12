import type { ApiResponse, PaginatedResponse } from '@shared/types';
import type { Booking, BookingListItem } from '@shared/types';
import { api } from './api';

export interface DashboardStats {
  totalBookingsThisMonth: number;
  revenueThisMonth: number;
  upcomingBookings: number;
  occupancyRate: number;
  recentBookings?: BookingListItem[];
}

export interface BlockedDate {
  _id: string;
  propertyId: string;
  date: string;
  createdAt: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  admin: { id: string; email: string; name: string; role: string };
}

interface AdminLoginApiPayload {
  accessToken: string;
  admin: { id?: string; _id?: string; email: string; name: string; role: string };
}

export async function login(email: string, password: string): Promise<AdminLoginResponse> {
  const { data } = await api.post<ApiResponse<AdminLoginApiPayload>>('/admin/auth/login', {
    email,
    password,
  });
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Login failed');
  }
  const res = data.data;
  const admin = res.admin;
  return {
    accessToken: res.accessToken,
    admin: {
      id: admin.id ?? admin._id ?? '',
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  };
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/admin/auth/refresh');
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Refresh failed');
  }
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/admin/auth/logout');
}

export interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  propertyId?: string;
  from?: string;
  to?: string;
}

export async function getBookings(params: GetBookingsParams = {}): Promise<{
  data: BookingListItem[];
  pagination: PaginatedResponse<BookingListItem>['pagination'];
}> {
  const { data } = await api.get<PaginatedResponse<BookingListItem>>('/admin/bookings', {
    params,
  });
  if (!data.success || !data.data) {
    throw new Error('Failed to fetch bookings');
  }
  return { data: data.data, pagination: data.pagination };
}

export async function getBooking(id: string): Promise<Booking> {
  const { data } = await api.get<ApiResponse<Booking>>(`/admin/bookings/${id}`);
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch booking');
  }
  return data.data;
}

export async function approveBooking(id: string): Promise<Booking> {
  const { data } = await api.patch<ApiResponse<Booking>>(`/admin/bookings/${id}/approve`);
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to approve');
  }
  return data.data;
}

export async function rejectBooking(id: string, reason: string): Promise<Booking> {
  const { data } = await api.patch<ApiResponse<Booking>>(`/admin/bookings/${id}/reject`, {
    reason,
  });
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to reject');
  }
  return data.data;
}

export async function checkInBooking(id: string): Promise<Booking> {
  const { data } = await api.patch<ApiResponse<Booking>>(`/admin/bookings/${id}/check-in`);
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to check in');
  }
  return data.data;
}

export async function checkOutBooking(id: string): Promise<Booking> {
  const { data } = await api.patch<ApiResponse<Booking>>(`/admin/bookings/${id}/check-out`);
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to check out');
  }
  return data.data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch dashboard stats');
  }
  return data.data;
}

export async function getBlockedDates(propertyId: string): Promise<BlockedDate[]> {
  const { data } = await api.get<ApiResponse<BlockedDate[]>>('/admin/blocked-dates', {
    params: { propertyId },
  });
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to fetch blocked dates');
  }
  return data.data;
}

export async function blockDates(
  propertyId: string,
  dates: string[]
): Promise<BlockedDate[]> {
  const { data } = await api.post<ApiResponse<BlockedDate[]>>('/admin/blocked-dates', {
    propertyId,
    dates,
  });
  if (!data.success || data.data == null) {
    throw new Error(data.error?.message ?? 'Failed to block dates');
  }
  return data.data;
}

export async function unblockDate(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse<unknown>>(`/admin/blocked-dates/${id}`);
  if (!data.success) {
    throw new Error(data.error?.message ?? 'Failed to unblock date');
  }
}
