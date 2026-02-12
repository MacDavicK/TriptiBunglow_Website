import { useQuery } from '@tanstack/react-query';
import { getProperties, getProperty } from '@/services/property.api';

const PROPERTIES_QUERY_KEY = ['properties'] as const;
const PROPERTY_QUERY_KEY = ['property'] as const;

const STALE_TIME_MS = 5 * 60 * 1000;

export function useProperties() {
  return useQuery({
    queryKey: PROPERTIES_QUERY_KEY,
    queryFn: getProperties,
    staleTime: STALE_TIME_MS,
  });
}

export function useProperty(slug: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...PROPERTY_QUERY_KEY, slug],
    queryFn: () => getProperty(slug!),
    enabled: Boolean(slug) && enabled,
    staleTime: STALE_TIME_MS,
  });
}
