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
  const [datesToBlock, setDatesToBlock] = useState<string[]>([]);
  const [datesToUnblock, setDatesToUnblock] = useState<string[]>([]);
  const [isUnblocking, setIsUnblocking] = useState(false);
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
      setDatesToBlock([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to block dates'),
  });

  const dateMap = useMemo(() => {
    const map: Record<string, CalendarDayInfo> = {};
    (blockedList ?? []).forEach((d) => {
      map[d.date.slice(0, 10)] = { status: 'blocked', recordId: d._id };
    });
    return map;
  }, [blockedList]);

  const handleDateClick = (dateStr: string) => {
    const info = dateMap[dateStr];

    if (info?.status === 'booked') return;

    if (info?.status === 'blocked') {
      setDatesToUnblock((prev) =>
        prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
      );
      return;
    }

    setDatesToBlock((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
    );
  };

  const handleBlockDates = () => {
    if (datesToBlock.length) blockMutation.mutate(datesToBlock);
  };

  const handleUnblockDates = async () => {
    const recordIds = datesToUnblock
      .map((dateStr) => {
        const record = blockedList?.find((b) => b.date.slice(0, 10) === dateStr);
        return record?._id;
      })
      .filter(Boolean) as string[];

    if (recordIds.length === 0) return;

    setIsUnblocking(true);
    try {
      await Promise.all(recordIds.map((id) => unblockDate(id)));
      queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-dates', propertyId] });
      toast.success(`${recordIds.length} date${recordIds.length !== 1 ? 's' : ''} unblocked`);
      setDatesToUnblock([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unblock dates');
    } finally {
      setIsUnblocking(false);
    }
  };

  const clearAll = () => {
    setDatesToBlock([]);
    setDatesToUnblock([]);
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
        selectedDates={datesToBlock}
        unblockSelectedDates={datesToUnblock}
        onDateClick={handleDateClick}
        month={month}
        onMonthChange={setMonth}
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={handleBlockDates}
          disabled={datesToBlock.length === 0}
          loading={blockMutation.isPending}
          className="py-3 px-6"
        >
          Block {datesToBlock.length} date{datesToBlock.length !== 1 ? 's' : ''}
        </Button>
        <Button
          variant="danger"
          onClick={handleUnblockDates}
          disabled={datesToUnblock.length === 0}
          loading={isUnblocking}
          className="py-3 px-6"
        >
          Unblock {datesToUnblock.length} date{datesToUnblock.length !== 1 ? 's' : ''}
        </Button>
        {(datesToBlock.length > 0 || datesToUnblock.length > 0) && (
          <Button variant="secondary" onClick={clearAll} className="py-3 px-6">
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
        Click available dates to select for blocking (blue). Click blocked dates to select for unblocking (amber).
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
          <span className="inline-block h-5 w-5 rounded-md bg-amber-200 border-2 border-amber-500" />
          Selected for unblocking
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
