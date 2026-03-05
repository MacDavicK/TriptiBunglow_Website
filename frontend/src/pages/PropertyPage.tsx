import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { useProperty } from '@/hooks/useProperties';
import { useAvailability } from '@/hooks/useAvailability';
import { formatCurrency } from '@/utils/format-currency';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { ImageSlideshow } from '@/components/ui/ImageSlideshow';
import type { DateRange } from 'react-day-picker';

const RATE_PAISE = 4000000;
const DEPOSIT_PAISE = 500000;

export function PropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [month, setMonth] = useState(new Date());
  const [range, setRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(2);

  const { data: property, isLoading: loadingProperty, error: propertyError } = useProperty(slug);
  const { data: availability, isLoading: loadingAvail } = useAvailability(
    property?._id,
    month.getMonth() + 1,
    month.getFullYear(),
    Boolean(property?._id)
  );

  const { availableSet, pendingSet, bookedSet } = useMemo(() => {
    const avail = new Set<string>();
    const pending = new Set<string>();
    const booked = new Set<string>();

    if (availability?.dates) {
      for (const entry of availability.dates) {
        const key = entry.date.slice(0, 10);
        if (entry.status === 'available') avail.add(key);
        else if (entry.status === 'pending') pending.add(key);
        else booked.add(key);
      }
    } else if (availability?.available) {
      availability.available.forEach((d) => avail.add(d.slice(0, 10)));
    }

    return { availableSet: avail, pendingSet: pending, bookedSet: booked };
  }, [availability]);

  const disabledDays = useMemo(() => {
    const hasStatusData = Boolean(availability?.dates);
    return (date: Date) => {
      const key = format(date, 'yyyy-MM-dd');
      return hasStatusData
        ? (bookedSet.has(key) || pendingSet.has(key))
        : !availableSet.has(key);
    };
  }, [availability?.dates, bookedSet, availableSet]);

  const nights = range?.from && range?.to
    ? Math.max(0, Math.ceil((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;
  const totalPaise = nights * RATE_PAISE + DEPOSIT_PAISE;

  if (propertyError) {
    return (
      <PageContainer>
        <ErrorBanner message={propertyError instanceof Error ? propertyError.message : 'Failed to load'} />
      </PageContainer>
    );
  }

  if (loadingProperty || !property) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-6">
        <ImageSlideshow
          images={property.photos ?? []}
          alt={property.name}
          variant="card"
          interval={5000}
          className="max-h-96 rounded-xl"
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="mt-2 text-gray-600">{property.description || 'A beautiful bungalow in Thane.'}</p>
            <p className="mt-4 text-sm font-medium text-gray-700">
              {formatCurrency(property.ratePerNight)}/night · Max {property.maxGuests} guests
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
              {property.amenities.map((a: string) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <Card className="sticky top-24">
              <h3 className="font-semibold text-gray-900">Book this property</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Select dates</p>
                {loadingAvail ? (
                  <Skeleton className="mt-2 h-64 w-full" />
                ) : (
                  <>
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      disabled={disabledDays}
                      month={month}
                      onMonthChange={setMonth}
                      modifiers={{
                        pending: (date) => pendingSet.has(format(date, 'yyyy-MM-dd')),
                        booked: (date) => bookedSet.has(format(date, 'yyyy-MM-dd')),
                      }}
                      modifiersClassNames={{
                        pending: 'bg-amber-100 text-amber-700',
                        booked: 'bg-gray-200 text-gray-400',
                      }}
                      className="mt-2 rounded-lg border border-gray-200 p-2"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-full bg-amber-200 border border-amber-400" />
                        Pending confirmation
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-full bg-gray-300" />
                        Booked
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Guests</label>
                <input
                  type="number"
                  min={1}
                  max={property.maxGuests}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              {nights > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
                  <p>
                    {nights} night{nights !== 1 ? 's' : ''} × {formatCurrency(RATE_PAISE)} ={' '}
                    {formatCurrency(nights * RATE_PAISE)}
                  </p>
                  <p className="mt-1">Security deposit: {formatCurrency(DEPOSIT_PAISE)}</p>
                  <p className="mt-2 font-semibold">Total: {formatCurrency(totalPaise)}</p>
                </div>
              )}
              <Link
                to={`/book/${property.slug}${range?.from ? `?checkIn=${format(range.from, 'yyyy-MM-dd')}&checkOut=${range?.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')}&guests=${guestCount}` : ''}`}
              >
                <Button variant="primary" className="mt-4 w-full" disabled={nights === 0}>
                  Proceed to Book
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
