import { useQuery } from '@tanstack/react-query';
import { getAvailability } from '@/services/booking.api';

const AVAILABILITY_QUERY_KEY = ['availability'] as const;
const STALE_TIME_MS = 30 * 1000;

export function useAvailability(
  propertyId: string | undefined,
  month: number,
  year: number,
  enabled = true
) {
  return useQuery({
    queryKey: [...AVAILABILITY_QUERY_KEY, propertyId, month, year],
    queryFn: () => getAvailability(propertyId!, month, year),
    enabled: Boolean(propertyId) && enabled,
    staleTime: STALE_TIME_MS,
  });
}
