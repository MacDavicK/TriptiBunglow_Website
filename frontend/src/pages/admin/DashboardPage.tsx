import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/admin.api';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateIST } from '@/utils/format-date';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BookingStatusForBadge } from '@/utils/constants';

const PLACEHOLDER_STATS = {
  totalBookingsThisMonth: 12,
  revenueThisMonth: 3000000,
  upcomingBookings: 5,
  occupancyRate: 68,
  recentBookings: [
    {
      _id: '1',
      bookingId: 'BK-demo1',
      propertyIds: ['p1'],
      customerName: 'Guest One',
      customerPhone: '+91 98765 43210',
      checkIn: '2026-03-15T00:00:00.000Z',
      checkOut: '2026-03-17T00:00:00.000Z',
      nights: 2,
      bookingType: 'standard' as const,
      status: 'confirmed' as BookingStatusForBadge,
      totalCharged: 3000000,
      createdAt: '2026-02-10T00:00:00.000Z',
    },
  ],
};

export function DashboardPage() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: getDashboardStats,
    retry: false,
  });
  const display = stats ?? PLACEHOLDER_STATS;
  // TODO: Replace with real API call when backend is running

  if (error) {
    return (
      <PageContainer>
        <ErrorBanner
          message={error instanceof Error ? error.message : 'Failed to load dashboard'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-600">Overview of bookings and revenue</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </Card>
          ))
        ) : (
          <>
            <Card>
              <p className="text-sm font-medium text-gray-500">Bookings this month</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {display.totalBookingsThisMonth}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Revenue this month</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(display.revenueThisMonth)}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Upcoming bookings</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {display.upcomingBookings}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Occupancy rate</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {display.occupancyRate}%
              </p>
            </Card>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          to="/admin/blocked-dates"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Block dates
        </Link>
        <Link
          to="/admin/bookings"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all bookings
        </Link>
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent bookings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Guest</th>
                <th className="pb-2 pr-4">Check-in</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(display.recentBookings ?? []).slice(0, 5).map((b) => (
                <tr key={b._id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    <Link to={`/admin/bookings/${b._id}`} className="text-indigo-600 hover:underline">
                      {b.bookingId}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{b.customerName}</td>
                  <td className="py-3 pr-4">{formatDateIST(b.checkIn)}</td>
                  <td className="py-3 pr-4">
                    <Badge status={b.status as BookingStatusForBadge} />
                  </td>
                  <td className="py-3">{formatCurrency(b.totalCharged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
