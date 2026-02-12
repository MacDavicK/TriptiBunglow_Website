import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockedDates, blockDates, unblockDate } from '@/services/admin.api';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PROPERTY_SLUGS } from '@/utils/constants';
import { useProperties } from '@/hooks/useProperties';
import toast from 'react-hot-toast';

const propertyOptions = [
  { value: '', label: 'Select property' },
  ...PROPERTY_SLUGS.map((s) => ({ value: s, label: s })),
];

export function BlockedDatesPage() {
  const [propertySlug, setPropertySlug] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const queryClient = useQueryClient();

  const { data: properties } = useProperties();
  const property = (properties as { _id: string; slug: string }[] | undefined)?.find(
    (p) => p.slug === propertySlug
  );
  const propertyId = property?._id;

  const { data: blockedList, error, refetch } = useQuery({
    queryKey: ['admin', 'blocked-dates', propertyId],
    queryFn: () => getBlockedDates(propertyId!),
    enabled: Boolean(propertyId),
  });

  const blockMutation = useMutation({
    mutationFn: (dates: string[]) => blockDates(propertyId!, dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-dates', propertyId] });
      toast.success('Dates blocked');
      setSelectedDates([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockDate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-dates', propertyId] });
      toast.success('Date unblocked');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const blockedSet = new Set(
    (blockedList ?? []).map((d) => d.date.slice(0, 10))
  );

  const handleDayClick = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    if (blockedSet.has(key)) {
      const record = blockedList?.find((b) => b.date.slice(0, 10) === key);
      if (record) unblockMutation.mutate(record._id);
    } else {
      setSelectedDates((prev) => {
        const next = prev.filter((d) => format(d, 'yyyy-MM-dd') !== key);
        if (next.length === prev.length) next.push(date);
        return next;
      });
    }
  };

  const handleSaveBlocked = () => {
    const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    if (dates.length && propertyId) blockMutation.mutate(dates);
  };

  if (error) {
    return (
      <PageContainer>
        <ErrorBanner
          message={error instanceof Error ? error.message : 'Failed to load blocked dates'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900">Blocked dates</h1>
      <p className="mt-1 text-gray-600">Select a property and click dates to block or unblock.</p>

      <div className="mt-6">
        <Select
          label="Property"
          options={propertyOptions}
          value={propertySlug}
          onChange={(e) => setPropertySlug(e.target.value)}
          className="w-48"
        />
      </div>

      {propertyId && (
        <Card className="mt-6">
          <DayPicker
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => setSelectedDates(dates ?? [])}
            onDayClick={handleDayClick}
            className="rounded-lg border border-gray-200 p-2"
            modifiers={{
              blocked: (date) => blockedSet.has(format(date, 'yyyy-MM-dd')),
            }}
            modifiersClassNames={{
              blocked: 'bg-red-100 text-red-800 line-through',
            }}
          />
          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              onClick={handleSaveBlocked}
              disabled={selectedDates.length === 0}
              loading={blockMutation.isPending}
            >
              Block selected dates
            </Button>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
