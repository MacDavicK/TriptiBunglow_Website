import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

export function formatDateIST(utcDate: string | Date): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return format(toZonedTime(date, IST), 'dd MMM yyyy');
}

export function formatDateRangeIST(checkIn: string, checkOut: string): string {
  const d1 = toZonedTime(new Date(checkIn), IST);
  const d2 = toZonedTime(new Date(checkOut), IST);
  return `${format(d1, 'dd MMM yyyy')}–${format(d2, 'dd MMM yyyy')}`;
}

export function formatRelativeIST(utcDate: string | Date): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const zoned = toZonedTime(date, IST);
  if (isToday(zoned)) return 'Today';
  if (isYesterday(zoned)) return 'Yesterday';
  return formatDistanceToNow(zoned, { addSuffix: true });
}
