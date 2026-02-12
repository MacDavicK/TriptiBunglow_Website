import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  message,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center',
        className
      )}
    >
      <div className="text-gray-400" aria-hidden>
        {icon ?? <Inbox className="mx-auto h-12 w-12" />}
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
