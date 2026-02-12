import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '@/services/booking.api';
import type { CreateBookingRequest } from '@shared/types';

const PROPERTIES_QUERY_KEY = ['properties'];
const AVAILABILITY_QUERY_KEY = ['availability'];

export function useBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEY });
    },
  });
}
