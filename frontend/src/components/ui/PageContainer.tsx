import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-7xl px-4 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
