import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay } from 'date-fns';
import { getDashboardStats, getBlockedDates, getBookings } from '@/services/admin.api';
import { useProperties } from '@/hooks/useProperties';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateIST } from '@/utils/format-date';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BookingStatusForBadge } from '@/utils/constants';

const PLACEHOLDER_STATS = {
  totalBookingsThisMonth: 12,
  revenueThisMonth: 4000000,
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
      totalCharged: 4000000,
      createdAt: '2026-02-10T00:00:00.000Z',
    },
  ],
};

const BOOKED_STATUSES = new Set(['pending_payment', 'confirmed', 'checked_in']);

function generateDateRange(checkIn: string, checkOut: string): string[] {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (start >= end) return [];
  const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });
  return days.map((d) => format(d, 'yyyy-MM-dd'));
}

interface PropertyCalendarProps {
  propertyId: string;
  propertyLabel: string;
  month: Date;
  onMonthChange: (m: Date) => void;
  bookedDates: Set<string>;
  blockedDates: Set<string>;
}

function PropertyCalendar({
  propertyLabel,
  month,
  onMonthChange,
  bookedDates,
  blockedDates,
}: PropertyCalendarProps) {
  const today = startOfDay(new Date());

  return (
    <Card className="flex-1 min-w-0">
      <h3 className="mb-4 text-xl font-bold text-gray-900">{propertyLabel}</h3>
      <div className="rdp-admin-large">
        <DayPicker
          mode="multiple"
          selected={[]}
          month={month}
          onMonthChange={onMonthChange}
          modifiers={{
            booked: (date) => bookedDates.has(format(date, 'yyyy-MM-dd')),
            blocked: (date) => blockedDates.has(format(date, 'yyyy-MM-dd')),
            'past-date': (date) => isBefore(date, today),
            'today-highlight': (date) => format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
          }}
          modifiersClassNames={{
            booked: 'rdp-booked',
            blocked: 'rdp-blocked',
            'past-date': 'rdp-past-date',
            'today-highlight': 'rdp-today-highlight',
          }}
          className="rounded-lg border border-gray-200 p-3"
        />
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const [month, setMonth] = useState(new Date());
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: getDashboardStats,
    retry: false,
  });
  const display = stats ?? PLACEHOLDER_STATS;

  const { data: properties } = useProperties();
  const propertyList = (properties as { _id: string; name: string; slug: string }[] | undefined) ?? [];

  const property1Id = propertyList[0]?._id;
  const property2Id = propertyList[1]?._id;

  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  const { data: bookingsData } = useQuery({
    queryKey: ['admin', 'bookings', 'calendar', monthStart, monthEnd],
    queryFn: () => getBookings({ from: monthStart, to: monthEnd, limit: 100 }),
    enabled: Boolean(property1Id),
  });

  const { data: blocked1 } = useQuery({
    queryKey: ['admin', 'blocked-dates', property1Id],
    queryFn: () => getBlockedDates(property1Id!),
    enabled: Boolean(property1Id),
  });

  const { data: blocked2 } = useQuery({
    queryKey: ['admin', 'blocked-dates', property2Id],
    queryFn: () => getBlockedDates(property2Id!),
    enabled: Boolean(property2Id),
  });

  const blocked1Set = useMemo(
    () => new Set((blocked1 ?? []).map((d) => d.date.slice(0, 10))),
    [blocked1],
  );
  const blocked2Set = useMemo(
    () => new Set((blocked2 ?? []).map((d) => d.date.slice(0, 10))),
    [blocked2],
  );

  const bookings = useMemo(() => bookingsData?.data ?? [], [bookingsData?.data]);

  const booked1Set = useMemo(() => {
    if (!property1Id) return new Set<string>();
    const set = new Set<string>();
    for (const b of bookings) {
      if (!BOOKED_STATUSES.has(b.status)) continue;
      if (!b.propertyIds?.includes(property1Id)) continue;
      generateDateRange(b.checkIn, b.checkOut).forEach((d) => set.add(d));
    }
    return set;
  }, [bookings, property1Id]);

  const booked2Set = useMemo(() => {
    if (!property2Id) return new Set<string>();
    const set = new Set<string>();
    for (const b of bookings) {
      if (!BOOKED_STATUSES.has(b.status)) continue;
      if (!b.propertyIds?.includes(property2Id)) continue;
      generateDateRange(b.checkIn, b.checkOut).forEach((d) => set.add(d));
    }
    return set;
  }, [bookings, property2Id]);

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
      <p className="mt-1 text-base text-gray-600">Overview of bookings and revenue</p>

      {/* Stat cards */}
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
              <p className="text-base font-medium text-gray-500">Bookings this month</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {display.totalBookingsThisMonth}
              </p>
            </Card>
            <Card>
              <p className="text-base font-medium text-gray-500">Revenue this month</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(display.revenueThisMonth)}
              </p>
            </Card>
            <Card>
              <p className="text-base font-medium text-gray-500">Upcoming bookings</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {display.upcomingBookings}
              </p>
            </Card>
            <Card>
              <p className="text-base font-medium text-gray-500">Occupancy rate</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {display.occupancyRate}%
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link to="/admin/blocked-dates">
          <Button variant="secondary">Block Dates</Button>
        </Link>
        <Link to="/admin/bookings">
          <Button variant="secondary">View All Bookings</Button>
        </Link>
      </div>

      {/* Availability calendars */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900">Availability Overview</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {property1Id && (
            <PropertyCalendar
              propertyId={property1Id}
              propertyLabel={propertyList[0]?.name.includes('15') ? 'No. 15' : 'No. 14'}
              month={month}
              onMonthChange={setMonth}
              bookedDates={booked1Set}
              blockedDates={blocked1Set}
            />
          )}
          {property2Id && (
            <PropertyCalendar
              propertyId={property2Id}
              propertyLabel={propertyList[1]?.name.includes('15') ? 'No. 15' : 'No. 14'}
              month={month}
              onMonthChange={setMonth}
              bookedDates={booked2Set}
              blockedDates={blocked2Set}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-6 text-base text-gray-700">
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-green-200 ring-1 ring-green-400" />
            Booked
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-red-200 ring-1 ring-red-400" />
            Blocked / Maintenance
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-white ring-1 ring-gray-300" />
            Available
          </span>
        </div>
      </div>

      {/* Recent bookings table */}
      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent bookings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-base">
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
