import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from '@/services/admin.api';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateIST } from '@/utils/format-date';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { BOOKING_STATUSES } from '@/utils/constants';
import type { BookingStatusForBadge } from '@/utils/constants';

const statusOptions = [
  { value: '', label: 'All statuses' },
  ...BOOKING_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
];

export function BookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const limit = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'bookings', { page, limit, status: status || undefined }],
    queryFn: () => getBookings({ page, limit, status: status || undefined }),
  });

  if (error) {
    return (
      <PageContainer>
        <ErrorBanner
          message={error instanceof Error ? error.message : 'Failed to load bookings'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const list = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
      <div className="mt-4 flex flex-wrap gap-4">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-48"
        />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                : list.map((b) => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link to={`/admin/bookings/${b._id}`} className="font-medium text-indigo-600 hover:underline">
                          {b.bookingId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{b.customerName}</td>
                      <td className="px-4 py-3">{b.customerPhone}</td>
                      <td className="px-4 py-3">{formatDateIST(b.checkIn)}</td>
                      <td className="px-4 py-3">{formatDateIST(b.checkOut)}</td>
                      <td className="px-4 py-3">
                        <Badge status={b.status as BookingStatusForBadge} />
                      </td>
                      <td className="px-4 py-3">{formatCurrency(b.totalCharged)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/bookings/${b._id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && list.length === 0 && (
          <EmptyState message="No bookings found" className="m-4" />
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
