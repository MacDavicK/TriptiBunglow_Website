import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBooking, approveBooking, rejectBooking, checkInBooking, checkOutBooking } from '@/services/admin.api';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateIST } from '@/utils/format-date';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Spinner } from '@/components/ui/Spinner';
import type { BookingStatusForBadge } from '@/utils/constants';
import toast from 'react-hot-toast';

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'booking', id],
    queryFn: () => getBooking(id!),
    enabled: Boolean(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Booking approved');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectBooking(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Booking rejected');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const checkInMutation = useMutation({
    mutationFn: () => checkInBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Checked in');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Checked out');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  if (error) {
    return (
      <PageContainer>
        <ErrorBanner message={error instanceof Error ? error.message : 'Failed to load'} onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !booking) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  const status = booking.status as BookingStatusForBadge;

  return (
    <PageContainer>
      <Link to="/admin/bookings" className="text-sm text-indigo-600 hover:underline">
        ← Back to bookings
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Booking {booking.bookingId}
        </h1>
        <Badge status={status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-gray-900">Booking details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Check-in</dt>
              <dd>{formatDateIST(booking.checkIn)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Check-out</dt>
              <dd>{formatDateIST(booking.checkOut)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Nights</dt>
              <dd>{booking.nights}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Guest count</dt>
              <dd>{booking.guestCount}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total charged</dt>
              <dd>{formatCurrency(booking.totalCharged)}</dd>
            </div>
            {booking.specialRequests && (
              <div>
                <dt className="text-gray-500">Special requests</dt>
                <dd>{booking.specialRequests}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === 'pending_approval' && (
              <>
                <Button
                  variant="primary"
                  onClick={() => approveMutation.mutate()}
                  loading={approveMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => rejectMutation.mutate('Declined by admin')}
                  loading={rejectMutation.isPending}
                >
                  Reject
                </Button>
              </>
            )}
            {status === 'confirmed' && (
              <Button
                variant="primary"
                onClick={() => checkInMutation.mutate()}
                loading={checkInMutation.isPending}
              >
                Check-in
              </Button>
            )}
            {status === 'checked_in' && (
              <Button
                variant="primary"
                onClick={() => checkOutMutation.mutate()}
                loading={checkOutMutation.isPending}
              >
                Check-out & refund deposit
              </Button>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Damage report (photo, amount, deduct) — stub for Day 6–8.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
