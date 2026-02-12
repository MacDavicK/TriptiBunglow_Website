import { cn } from '@/utils/cn';
import type { BookingStatusForBadge } from '@/utils/constants';

const colorClasses: Record<
  BookingStatusForBadge,
  string
> = {
  hold: 'bg-blue-100 text-blue-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  checked_in: 'bg-purple-100 text-purple-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const labelByStatus: Record<BookingStatusForBadge, string> = {
  hold: 'Hold',
  pending_approval: 'Pending approval',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export interface BadgeProps {
  status: BookingStatusForBadge;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const colorClass = colorClasses[status];
  const label = labelByStatus[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  );
}
