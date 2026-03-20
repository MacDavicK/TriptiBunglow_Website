import { useMemo, useState } from 'react';
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isBefore,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export interface CalendarDayInfo {
  status: 'booked' | 'blocked' | 'pending' | 'available';
  recordId?: string;
}

export interface BookingCalendarProps {
  title?: string;
  dateMap: Record<string, CalendarDayInfo>;
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  readOnly?: boolean;
  selectedDates?: string[];
  unblockSelectedDates?: string[];
  onDateSelect?: (dateStr: string) => void;
  onDateClick?: (dateStr: string) => void;
  rangeMode?: boolean;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  onRangeSelect?: (dateStr: string) => void;
  size?: 'default' | 'compact' | 'mini';
  showLegend?: boolean;
  legendItems?: ('booked' | 'blocked' | 'pending' | 'available' | 'selected' | 'range')[];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const SIZE_CONFIG = {
  default: {
    cell: 'min-h-[3.5rem] min-w-[3.5rem] text-lg',
    weekday: 'text-sm min-h-[2rem]',
    title: 'text-xl',
    monthLabel: 'text-xl',
    navButton: 'p-2',
  },
  compact: {
    cell: 'min-h-[2.5rem] min-w-[2.5rem] text-base',
    weekday: 'text-xs min-h-[1.5rem]',
    title: 'text-lg',
    monthLabel: 'text-lg',
    navButton: 'p-1.5',
  },
  mini: {
    cell: 'min-h-[2rem] min-w-[2rem] text-sm',
    weekday: 'text-xs min-h-[1.25rem]',
    title: 'text-base',
    monthLabel: 'text-base',
    navButton: 'p-1',
  },
} as const;

const DEFAULT_LEGEND_ITEMS: BookingCalendarProps['legendItems'] = [
  'booked',
  'pending',
  'blocked',
  'range',
  'available',
];

export function BookingCalendar({
  title,
  dateMap,
  month,
  onMonthChange,
  readOnly = false,
  selectedDates = [],
  unblockSelectedDates = [],
  onDateSelect,
  onDateClick,
  rangeMode = false,
  rangeStart = null,
  rangeEnd = null,
  onRangeSelect,
  size = 'default',
  showLegend = false,
  legendItems = DEFAULT_LEGEND_ITEMS,
}: BookingCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const today = useMemo(() => format(startOfDay(new Date()), 'yyyy-MM-dd'), []);
  const todayDate = startOfDay(new Date());
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const unblockSelectedSet = useMemo(() => new Set(unblockSelectedDates), [unblockSelectedDates]);
  const sizeClass = SIZE_CONFIG[size];

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const startWeekday = getDay(first);
    const totalDays = getDaysInMonth(month);
    const result: (number | null)[] = [];

    for (let i = 0; i < startWeekday; i += 1) result.push(null);
    for (let d = 1; d <= totalDays; d += 1) result.push(d);

    return result;
  }, [month]);

  const monthLabel = format(month, 'MMMM yyyy');

  const handleCellClick = (dateStr: string) => {
    const status = dateMap[dateStr]?.status ?? 'available';
    if (readOnly) return;

    if (rangeMode) {
      if (status !== 'available') return;
      onRangeSelect?.(dateStr);
      return;
    }

    if (onDateClick) {
      onDateClick(dateStr);
      return;
    }

    if (status === 'booked') return;
    if ((status === 'available' || selectedSet.has(dateStr)) && onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  return (
    <Card className="flex-1 min-w-0">
      {title ? (
        <h3 className={`mb-4 font-bold text-gray-900 ${sizeClass.title}`}>{title}</h3>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(month, 1))}
          className={`rounded-lg hover:bg-gray-100 transition-colors ${sizeClass.navButton}`}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <span className={`font-bold text-gray-900 ${sizeClass.monthLabel}`}>{monthLabel}</span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className={`rounded-lg hover:bg-gray-100 transition-colors ${sizeClass.navButton}`}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <div role="grid" aria-label={`${monthLabel} calendar`}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={`flex items-center justify-center font-semibold uppercase text-gray-500 ${sizeClass.weekday}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className={sizeClass.cell.split(' text-')[0]} />;
            }

            const dateStr = format(
              new Date(month.getFullYear(), month.getMonth(), day),
              'yyyy-MM-dd'
            );
            const info = dateMap[dateStr];
            const status = info?.status ?? 'available';
            const isSelected = selectedSet.has(dateStr);
            const isUnblockSelected = unblockSelectedSet.has(dateStr);
            const isToday = dateStr === today;
            const isPast = isBefore(new Date(dateStr), todayDate) && !isToday;
            const isRangeStart = rangeMode && rangeStart === dateStr;
            const isRangeEnd = rangeMode && rangeEnd === dateStr;
            const isInRange =
              rangeMode &&
              Boolean(rangeStart) &&
              Boolean(rangeEnd) &&
              dateStr > String(rangeStart) &&
              dateStr < String(rangeEnd);
            const isInHoverPreview =
              rangeMode &&
              Boolean(rangeStart) &&
              !rangeEnd &&
              Boolean(hoveredDate) &&
              dateStr > String(rangeStart) &&
              dateStr <= String(hoveredDate);

            let cellClass =
              `flex items-center justify-center rounded-lg font-medium transition-colors select-none border ${sizeClass.cell}`;

            if (isUnblockSelected) {
              cellClass += ' bg-amber-200 border-2 border-amber-500 text-amber-900 font-semibold';
            } else if (isSelected) {
              cellClass += ' bg-blue-100 border-2 border-blue-400 text-blue-900 font-semibold';
            } else if (status === 'booked') {
              cellClass += ' bg-green-100 border-green-300 text-green-900 font-semibold';
            } else if (status === 'pending') {
              cellClass += ' bg-amber-100 border-amber-300 text-amber-800';
            } else if (status === 'blocked') {
              cellClass += ' bg-red-100 border-red-300 text-red-800 line-through';
            } else {
              cellClass += ' bg-white border-gray-200';
            }

            if (isRangeStart) {
              cellClass += ' bg-indigo-600 text-white rounded-l-lg border-indigo-600';
            } else if (isRangeEnd) {
              cellClass += ' bg-indigo-600 text-white rounded-r-lg border-indigo-600';
            } else if (isInRange) {
              cellClass += ' bg-indigo-100 text-indigo-800 rounded-none border-indigo-200';
            } else if (isInHoverPreview) {
              cellClass += ' bg-indigo-50 text-indigo-700 rounded-none border-indigo-100';
            }

            if (isPast) {
              cellClass += ' opacity-40';
            }

            if (isToday) {
              cellClass += ' ring-2 ring-indigo-500 ring-offset-1';
            }

            const isInteractable = !readOnly && (!rangeMode ? status !== 'booked' : status === 'available');
            if (isInteractable) {
              cellClass += ' cursor-pointer hover:brightness-95';
            }

            const statusLabel = isUnblockSelected
              ? 'Selected for unblocking'
              : isSelected
                ? 'Selected for blocking'
                : status.charAt(0).toUpperCase() + status.slice(1);

            return (
              <div
                key={dateStr}
                role="gridcell"
                aria-label={`${format(new Date(dateStr), 'MMMM d, yyyy')} - ${statusLabel}`}
                className={cellClass}
                onClick={() => handleCellClick(dateStr)}
                onMouseEnter={() => {
                  if (rangeMode && rangeStart && !rangeEnd) setHoveredDate(dateStr);
                }}
                onMouseLeave={() => {
                  if (rangeMode) setHoveredDate(null);
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          {legendItems?.includes('booked') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-green-100 border border-green-300" />
              Booked
            </span>
          )}
          {legendItems?.includes('pending') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-amber-100 border border-amber-300" />
              Pending
            </span>
          )}
          {legendItems?.includes('blocked') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-red-100 border border-red-300" />
              Maintenance
            </span>
          )}
          {legendItems?.includes('selected') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-blue-100 border border-blue-400" />
              Selected
            </span>
          )}
          {legendItems?.includes('range') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-indigo-600" />
              Your dates
            </span>
          )}
          {legendItems?.includes('available') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-md bg-white border border-gray-200" />
              Available
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
