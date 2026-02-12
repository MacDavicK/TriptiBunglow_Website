import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/useProperties';
import { formatCurrency } from '@/utils/format-currency';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { PropertyListItem } from '@shared/types';

const PLACEHOLDER_PROPERTIES: PropertyListItem[] = [
  {
    _id: '1',
    name: 'Bungalow A',
    slug: 'bungalow-a',
    ratePerNight: 2500000,
    maxGuests: 8,
    photos: [],
    amenities: ['WiFi', 'Parking', 'Kitchen'],
  },
  {
    _id: '2',
    name: 'Bungalow B',
    slug: 'bungalow-b',
    ratePerNight: 2500000,
    maxGuests: 8,
    photos: [],
    amenities: ['WiFi', 'Parking', 'Kitchen'],
  },
];

export function HomePage() {
  const { data: properties, isLoading, error, refetch } = useProperties();
  const list = (properties as PropertyListItem[] | undefined) ?? PLACEHOLDER_PROPERTIES;
  // TODO: Replace with real API call — remove placeholder when backend is running

  return (
    <PageContainer>
      <section className="py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Vacation Bungalows in Thane
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Two beautiful bungalows in Thane, Maharashtra — perfect for getaways
            with family and friends.
          </p>
          <Link
            to="/property/bungalow-a"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            View Properties
          </Link>
        </div>
      </section>

      {error && (
        <ErrorBanner
          message={error instanceof Error ? error.message : 'Failed to load properties'}
          onRetry={() => refetch()}
          className="mb-6"
        />
      )}

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">Our Properties</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            : list.map((property) => (
                <Card key={property._id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200">
                    {property.photos?.[0] ? (
                      <img
                        src={property.photos[0]}
                        alt={property.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatCurrency(property.ratePerNight)}/night · Up to{' '}
                      {property.maxGuests} guests
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {property.amenities.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/book/${property.slug}`}
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Book Now
                    </Link>
                  </div>
                </Card>
              ))}
        </div>
      </section>
    </PageContainer>
  );
}
