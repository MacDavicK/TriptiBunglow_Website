import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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
import { AdminCalendar, type CalendarDayInfo } from '@/components/admin/AdminCalendar';
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
      const pids = (b.propertyIds ?? []).map((p: any) =>
        typeof p === 'string' ? p : (p._id || p.id || String(p))
      );
      if (!pids.includes(property1Id)) continue;
      generateDateRange(b.checkIn, b.checkOut).forEach((d) => set.add(d));
    }
    return set;
  }, [bookings, property1Id]);

  const booked2Set = useMemo(() => {
    if (!property2Id) return new Set<string>();
    const set = new Set<string>();
    for (const b of bookings) {
      if (!BOOKED_STATUSES.has(b.status)) continue;
      const pids = (b.propertyIds ?? []).map((p: any) =>
        typeof p === 'string' ? p : (p._id || p.id || String(p))
      );
      if (!pids.includes(property2Id)) continue;
      generateDateRange(b.checkIn, b.checkOut).forEach((d) => set.add(d));
    }
    return set;
  }, [bookings, property2Id]);

  const dateMap1 = useMemo(() => {
    const map: Record<string, CalendarDayInfo> = {};
    booked1Set.forEach((d) => { map[d] = { status: 'booked' }; });
    blocked1Set.forEach((d) => { map[d] = { status: 'blocked' }; });
    return map;
  }, [booked1Set, blocked1Set]);

  const dateMap2 = useMemo(() => {
    const map: Record<string, CalendarDayInfo> = {};
    booked2Set.forEach((d) => { map[d] = { status: 'booked' }; });
    blocked2Set.forEach((d) => { map[d] = { status: 'blocked' }; });
    return map;
  }, [booked2Set, blocked2Set]);

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
            <AdminCalendar
              title={propertyList[0]?.name.includes('15') ? 'No. 15' : 'No. 14'}
              dateMap={dateMap1}
              readOnly
              month={month}
              onMonthChange={setMonth}
            />
          )}
          {property2Id && (
            <AdminCalendar
              title={propertyList[1]?.name.includes('15') ? 'No. 15' : 'No. 14'}
              dateMap={dateMap2}
              readOnly
              month={month}
              onMonthChange={setMonth}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-6 text-base text-gray-700">
          <span className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-md bg-green-100 border border-green-300" />
            Booked
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-md bg-red-100 border border-red-300" />
            Blocked / Maintenance
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-md bg-white border border-gray-200" />
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
