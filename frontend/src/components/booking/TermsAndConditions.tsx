import { useRef, useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTermsAndConditions } from '@/services/terms.api';
import { Skeleton } from '@/components/ui/Skeleton';

const TERMS_QUERY_KEY = ['terms-and-conditions'] as const;

const CHECKBOX_LABEL =
  'I have read, understood, and agree to all the above Terms & Conditions. I acknowledge that I am legally bound by these terms and that the management is not responsible for any consequences arising from a breach of these conditions.';

export interface TermsAndConditionsProps {
  onAccept: (accepted: boolean, version: string, acceptedAt: string) => void;
  error?: string;
}

export function TermsAndConditions({ onAccept, error }: TermsAndConditionsProps) {
  const [checked, setChecked] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: TERMS_QUERY_KEY,
    queryFn: getTermsAndConditions,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !data?.rules?.length) return;
    const checkOverflow = () => {
      setShowScrollHint(el.scrollHeight > el.clientHeight);
    };
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data?.rules?.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    const version = data?.version ?? '1.0';
    onAccept(isChecked, version, isChecked ? new Date().toISOString() : '');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {queryError instanceof Error ? queryError.message : 'Failed to load Terms & Conditions.'}
      </div>
    );
  }

  const { rules } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 shrink-0 text-indigo-600" aria-hidden />
        <h2 className="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
      </div>
      <p className="text-sm text-gray-600">
        These rules apply to both bungalows. Please read carefully before proceeding.
      </p>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4"
          tabIndex={0}
          role="region"
          aria-label="Terms and conditions list"
        >
          <ol className="list-decimal space-y-2 pl-5 pr-2 text-sm text-gray-700">
            {rules.map((rule) => (
              <li key={rule.id} className="pl-1">
                {rule.text}
              </li>
            ))}
          </ol>
        </div>
        {showScrollHint && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent" />
        )}
        {showScrollHint && (
          <p className="mt-1 text-center text-xs text-gray-500">↓ Scroll to read all</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            aria-describedby={error ? 'terms-error' : undefined}
          />
          <span className="text-sm text-gray-700">{CHECKBOX_LABEL}</span>
        </label>
        {error && (
          <p id="terms-error" className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
