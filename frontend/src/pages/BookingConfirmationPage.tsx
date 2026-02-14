import { useParams, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';

export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-amber-100 p-4">
          <Clock className="h-12 w-12 text-amber-600" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Booking Received</h1>
        {bookingId && (
          <p className="mt-2 text-gray-600">
            Booking ID: <strong>{bookingId}</strong>
          </p>
        )}
        <p className="mt-4 max-w-md text-sm text-gray-500">
          Thank you! Your booking request and payment details have been submitted. The property
          owner will verify your UPI payment and confirm your booking within <strong>24 hours</strong>.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          You will receive a confirmation email once verified. If you don't hear back within 48
          hours, please contact us.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
