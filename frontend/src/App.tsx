import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { HomePage } from '@/pages/HomePage';
import { PropertyPage } from '@/pages/PropertyPage';
import { BookingPage } from '@/pages/BookingPage';
import { BookingConfirmationPage } from '@/pages/BookingConfirmationPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { BookingsPage } from '@/pages/admin/BookingsPage';
import { BookingDetailPage } from '@/pages/admin/BookingDetailPage';
import { BlockedDatesPage } from '@/pages/admin/BlockedDatesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'property/:slug', element: <PropertyPage /> },
      { path: 'book/:slug', element: <BookingPage /> },
      { path: 'booking/confirmation/:bookingId', element: <BookingConfirmationPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
    ],
  },
  { path: 'admin/login', element: <LoginPage /> },
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'bookings/:id', element: <BookingDetailPage /> },
      { path: 'blocked-dates', element: <BlockedDatesPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
