import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockedDates, blockDates, unblockDate } from '@/services/admin.api';
import { useProperties } from '@/hooks/useProperties';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import toast from 'react-hot-toast';

interface BungalowCalendarProps {
  propertyId: string;
  propertyName: string;
}

function BungalowCalendar({ propertyId, propertyName }: BungalowCalendarProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
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

  const blockedSet = new Set(
    (blockedList ?? []).map((d) => d.date.slice(0, 10))
  );

  const handleDayClick = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    if (blockedSet.has(key)) {
      const record = blockedList?.find((b) => b.date.slice(0, 10) === key);
      if (record) unblockMutation.mutate(record._id);
    }
  };

  const handleSaveBlocked = () => {
    const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    if (dates.length) blockMutation.mutate(dates);
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
    <Card className="flex-1 min-w-0">
      <h3 className="mb-4 text-xl font-bold text-gray-900">{propertyName}</h3>
      <DayPicker
        mode="multiple"
        selected={selectedDates}
        onSelect={(dates) => setSelectedDates(dates ?? [])}
        onDayClick={handleDayClick}
        modifiers={{
          blocked: (date) => blockedSet.has(format(date, 'yyyy-MM-dd')),
        }}
        modifiersClassNames={{
          blocked: 'rdp-blocked',
        }}
        className="rdp-large rounded-lg border border-gray-200 p-3"
      />
      <div className="mt-4">
        <Button
          variant="primary"
          onClick={handleSaveBlocked}
          disabled={selectedDates.length === 0}
          loading={blockMutation.isPending}
          className="py-3 px-6"
        >
          Block selected dates ({selectedDates.length})
        </Button>
      </div>
    </Card>
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
      <div className="mt-6 flex flex-wrap items-center gap-6 text-base text-gray-700">
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-red-200 ring-1 ring-red-400" />
          Blocked
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-blue-200 ring-1 ring-blue-400" />
          Selected (click &quot;Block&quot; to confirm)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-white ring-1 ring-gray-300" />
          Available
        </span>
      </div>
    </PageContainer>
  );
}
