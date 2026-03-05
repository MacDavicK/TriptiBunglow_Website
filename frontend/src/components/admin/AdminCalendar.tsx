import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  getDaysInMonth,
  getDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export interface CalendarDayInfo {
  status: 'booked' | 'blocked' | 'available';
  recordId?: string;
}

export interface AdminCalendarProps {
  title: string;
  dateMap: Record<string, CalendarDayInfo>;
  selectedDates?: string[];
  unblockSelectedDates?: string[];
  onDateClick?: (dateStr: string) => void;
  onDateSelect?: (dateStr: string) => void;
  onDateUnblock?: (dateStr: string, recordId: string) => void;
  readOnly?: boolean;
  month: Date;
  onMonthChange: (newMonth: Date) => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

export function AdminCalendar({
  title,
  dateMap,
  selectedDates = [],
  unblockSelectedDates = [],
  onDateClick,
  onDateSelect,
  onDateUnblock,
  readOnly = false,
  month,
  onMonthChange,
}: AdminCalendarProps) {
  const today = useMemo(() => format(startOfDay(new Date()), 'yyyy-MM-dd'), []);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const startWeekday = getDay(first);
    const totalDays = getDaysInMonth(month);
    const result: (number | null)[] = [];

    for (let i = 0; i < startWeekday; i++) result.push(null);
    for (let d = 1; d <= totalDays; d++) result.push(d);

    return result;
  }, [month]);

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const unblockSelectedSet = useMemo(() => new Set(unblockSelectedDates), [unblockSelectedDates]);

  const handleCellClick = (dateStr: string) => {
    if (readOnly) return;

    if (onDateClick) {
      onDateClick(dateStr);
      return;
    }

    const info = dateMap[dateStr];
    const status = info?.status ?? 'available';

    if (status === 'booked') return;

    if (status === 'blocked' && info?.recordId && onDateUnblock) {
      onDateUnblock(dateStr, info.recordId);
      return;
    }

    if ((status === 'available' || selectedSet.has(dateStr)) && onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  const monthLabel = format(month, 'MMMM yyyy');
  const todayDate = startOfDay(new Date());

  return (
    <Card className="flex-1 min-w-0">
      <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <span className="text-xl font-bold text-gray-900">{monthLabel}</span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Calendar grid */}
      <div role="grid" aria-label={`${monthLabel} calendar`}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="flex items-center justify-center text-sm font-semibold uppercase text-gray-500 min-h-[2rem]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[3.5rem]" />;
            }

            const dateStr = format(
              new Date(month.getFullYear(), month.getMonth(), day),
              'yyyy-MM-dd',
            );
            const info = dateMap[dateStr];
            const status = info?.status ?? 'available';
            const isSelected = selectedSet.has(dateStr);
            const isUnblockSelected = unblockSelectedSet.has(dateStr);
            const isToday = dateStr === today;
            const isPast = isBefore(new Date(dateStr), todayDate) && !isToday;

            let cellClass =
              'flex items-center justify-center min-h-[3.5rem] min-w-[3.5rem] rounded-lg text-lg font-medium transition-colors select-none';

            if (isUnblockSelected) {
              cellClass += ' bg-amber-200 border-2 border-amber-500 text-amber-900 font-semibold';
            } else if (isSelected) {
              cellClass += ' bg-blue-100 border-2 border-blue-400 text-blue-900 font-semibold';
            } else if (status === 'booked') {
              cellClass += ' bg-green-100 border border-green-300 text-green-900 font-semibold';
            } else if (status === 'blocked') {
              cellClass += ' bg-red-100 border border-red-300 text-red-800 line-through';
            } else {
              cellClass += ' bg-white border border-gray-200';
            }

            if (isPast) {
              cellClass += ' opacity-40';
            }

            if (isToday) {
              cellClass += ' ring-2 ring-indigo-500 ring-offset-1';
            }

            if (!readOnly && status !== 'booked') {
              cellClass += ' cursor-pointer hover:brightness-95';
            }

            const statusLabel = isUnblockSelected
              ? 'Selected for unblocking'
              : isSelected
                ? 'Selected for blocking'
                : status.charAt(0).toUpperCase() + status.slice(1);
            const ariaLabel = `${format(new Date(dateStr), 'MMMM d, yyyy')} - ${statusLabel}`;

            return (
              <div
                key={dateStr}
                role="gridcell"
                aria-label={ariaLabel}
                className={cellClass}
                onClick={() => handleCellClick(dateStr)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
