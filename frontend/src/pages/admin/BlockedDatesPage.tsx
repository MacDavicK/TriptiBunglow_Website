import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockedDates, blockDates, unblockDate } from '@/services/admin.api';
import { useProperties } from '@/hooks/useProperties';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { AdminCalendar, type CalendarDayInfo } from '@/components/admin/AdminCalendar';
import toast from 'react-hot-toast';

interface BungalowCalendarProps {
  propertyId: string;
  propertyName: string;
}

function BungalowCalendar({ propertyId, propertyName }: BungalowCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: blockedList, error, refetch } = useQuery({
    queryKey: ['admin', 'blocked-dates', propertyId],
    queryFn: () => getBlockedDates(propertyId),
    enabled: Boolean(propertyId),
  });

  const blockMutation = useMutation({
    mutationFn: (dates: string[]) => blockDates(propertyId, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-dates', propertyId] });
      toast.success(`Dates blocked for ${propertyName}`);
      setSelectedDates([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to block dates'),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockDate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-dates', propertyId] });
      toast.success('Date unblocked');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to unblock'),
  });

  const dateMap = useMemo(() => {
    const map: Record<string, CalendarDayInfo> = {};
    (blockedList ?? []).forEach((d) => {
      map[d.date.slice(0, 10)] = { status: 'blocked', recordId: d._id };
    });
    return map;
  }, [blockedList]);

  const handleDateSelect = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
    );
  };

  const handleDateUnblock = (_dateStr: string, recordId: string) => {
    unblockMutation.mutate(recordId);
  };

  const handleBlock = () => {
    if (selectedDates.length) blockMutation.mutate(selectedDates);
  };

  if (error) {
    return (
      <Card className="flex-1 min-w-0">
        <ErrorBanner
          message={error instanceof Error ? error.message : 'Failed to load blocked dates'}
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <AdminCalendar
        title={propertyName}
        dateMap={dateMap}
        selectedDates={selectedDates}
        onDateSelect={handleDateSelect}
        onDateUnblock={handleDateUnblock}
        month={month}
        onMonthChange={setMonth}
      />
      <div className="mt-4 flex items-center gap-4">
        <Button
          variant="primary"
          onClick={handleBlock}
          disabled={selectedDates.length === 0}
          loading={blockMutation.isPending}
          className="py-3 px-6"
        >
          Block {selectedDates.length} selected date{selectedDates.length !== 1 ? 's' : ''}
        </Button>
        {selectedDates.length > 0 && (
          <Button variant="secondary" onClick={() => setSelectedDates([])}>
            Clear selection
          </Button>
        )}
      </div>
    </div>
  );
}

export function BlockedDatesPage() {
  const { data: properties } = useProperties();
  const propertyList = (properties as { _id: string; name: string }[] | undefined) ?? [];

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900">Blocked Dates</h1>
      <p className="mt-1 text-base text-gray-600">
        Click available dates to select them for blocking. Click red blocked dates to unblock.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {propertyList.map((p) => (
          <BungalowCalendar key={p._id} propertyId={p._id} propertyName={p.name} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center gap-6 text-base text-gray-700">
        <span className="flex items-center gap-2">
          <span className="inline-block h-5 w-5 rounded-md bg-red-100 border border-red-300" />
          Blocked
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-5 w-5 rounded-md bg-blue-100 border-2 border-blue-400" />
          Selected for blocking
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-5 w-5 rounded-md bg-white border border-gray-200" />
          Available
        </span>
      </div>
    </PageContainer>
  );
}
