import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBooking,
  approveBooking,
  rejectBooking,
  checkInBooking,
  checkOutBooking,
  confirmPayment,
} from '@/services/admin.api';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateIST } from '@/utils/format-date';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Spinner } from '@/components/ui/Spinner';
import { FileText } from 'lucide-react';
import type { Customer } from '@shared/types';
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

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmPayment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Payment confirmed — booking is now confirmed');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to confirm payment'),
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

  // The API populates customerId as a full Customer object
  const customer: Customer | null =
    typeof booking.customerId === 'object' && booking.customerId !== null
      ? (booking.customerId as unknown as Customer)
      : null;

  return (
    <PageContainer>
      <Link to="/admin/bookings" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to bookings
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
            {booking.upiReference && (
              <div>
                <dt className="text-gray-500">UPI Reference</dt>
                <dd className="font-mono">{booking.upiReference}</dd>
              </div>
            )}
            {booking.paymentScreenshotUrl && (
              <div>
                <dt className="text-gray-500">Payment Screenshot</dt>
                <dd>
                  <a
                    href={booking.paymentScreenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View Screenshot
                  </a>
                </dd>
              </div>
            )}
            {booking.additionalGuests && booking.additionalGuests.length > 0 && (
              <div>
                <dt className="text-gray-500">Additional Guests</dt>
                <dd>
                  {booking.additionalGuests.map((g, i) => (
                    <span key={i}>
                      {g.name}
                      {i < booking.additionalGuests!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {customer && (
          <Card>
            <h2 className="font-semibold text-gray-900">Customer information</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd>{customer.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd>{customer.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd>{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Nationality</dt>
                <dd className="capitalize">{customer.nationality}</dd>
              </div>
              {customer.address && (
                <div>
                  <dt className="text-gray-500">Address</dt>
                  <dd>{customer.address}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        <Card>
          <h2 className="font-semibold text-gray-900">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === 'pending_payment' && (
              <Button
                variant="primary"
                onClick={() => confirmPaymentMutation.mutate()}
                loading={confirmPaymentMutation.isPending}
              >
                Confirm Payment
              </Button>
            )}
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
        </Card>
      </div>

      {/* Identity Documents */}
      <div className="mt-6">
        <Card>
          <h2 className="font-semibold text-gray-900">Identity documents</h2>

          {customer && (customer.aadhaarDocumentUrl || customer.idDocumentUrl) ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Primary guest — {customer.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-3">
                  {customer.aadhaarDocumentUrl && (
                    <a
                      href={customer.aadhaarDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      <FileText className="h-4 w-4" />
                      View Aadhaar Document
                    </a>
                  )}
                  {customer.idDocumentUrl && (
                    <a
                      href={customer.idDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      <FileText className="h-4 w-4" />
                      View ID Document
                    </a>
                  )}
                </div>
              </div>

              {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-700">Additional guests</h3>
                  <div className="mt-2 space-y-3">
                    {booking.additionalGuests.map((guest, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{guest.name}</span>
                        {guest.aadhaarDocumentUrl ? (
                          <a
                            href={guest.aadhaarDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Aadhaar
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No document</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              {customer
                ? 'Identity documents have been removed per data retention policy.'
                : 'Customer data not available.'}
            </p>
          )}

          {customer?.dataRetentionExpiresAt && (
            <p className="mt-4 text-xs text-gray-400">
              Documents auto-delete after {formatDateIST(customer.dataRetentionExpiresAt)}
            </p>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
