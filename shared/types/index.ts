// Shared Types — Thane Bungalow Booking System
// Source of truth for API request/response contracts.
// Both backend and frontend import from here.

export { type Property, type PropertyListItem } from './property';
export { type Booking, type BookingStatus, type BookingType, type CreateBookingRequest, type BookingListItem } from './booking';
export { type Customer, type CreateCustomerRequest } from './customer';
export { type Payment, type PaymentStatus, type CreateOrderRequest, type VerifyPaymentRequest, type CreateOrderResponse } from './payment';
export { type ApiResponse, type PaginatedResponse, type ApiError } from './api';
