import { useParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';

export function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const downloadIcs = () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Thane Bungalow Booking
UID:${bookingId}@thanebungalows
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${bookingId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-emerald-100 p-4">
          <Check className="h-12 w-12 text-emerald-600" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Booking confirmed</h1>
        {bookingId && (
          <p className="mt-2 text-gray-600">
            Booking ID: <strong>{bookingId}</strong>
          </p>
        )}
        <p className="mt-4 text-sm text-gray-500">
          You will receive a confirmation email and WhatsApp message shortly.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={downloadIcs}>
            Save to Calendar
          </Button>
          <Link to="/">
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
