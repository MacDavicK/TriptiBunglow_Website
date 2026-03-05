import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/useProperties';
import { formatCurrency } from '@/utils/format-currency';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ImageSlideshow } from '@/components/ui/ImageSlideshow';
import type { PropertyListItem } from '@shared/types';

// TODO: Replace with dynamic images from API when property photos are uploaded
const HERO_IMAGES: string[] = [];

const PLACEHOLDER_PROPERTIES: PropertyListItem[] = [
  {
    _id: '1',
    name: 'Tripti Bungalow, No. 15',
    slug: 'tripti-bungalow-15',
    ratePerNight: 4000000,
    maxGuests: 50,
    photos: [],
    amenities: ['2 Bedrooms', '2 Bathrooms', 'Hall', 'Kitchen', 'Balcony', 'Terrace', 'Large Lawn (up to 50 people)', 'Outdoor Seating Area (6 people)', 'Gated Parking (2 cars)', 'WiFi', 'AC'],
  },
  {
    _id: '2',
    name: 'Tripti Bungalow, No. 14',
    slug: 'tripti-bungalow-14',
    ratePerNight: 4000000,
    maxGuests: 50,
    photos: [],
    amenities: ['2 Bedrooms', '2 Bathrooms', 'Hall', 'Kitchen', 'Balcony', 'Terrace', 'Large Lawn (up to 50 people)', 'Outdoor Seating Area (6 people)', 'BBQ & Grill Area', 'Gated Parking (2 cars)', 'WiFi', 'AC'],
  },
];

export function HomePage() {
  const { data: properties, isLoading, error, refetch } = useProperties();
  const list = (properties as PropertyListItem[] | undefined) ?? PLACEHOLDER_PROPERTIES;
  // TODO: Replace with real API call — remove placeholder when backend is running

  return (
    <PageContainer>
      <ImageSlideshow
        images={HERO_IMAGES}
        alt="Tripti Bungalow — No. 14 & 15"
        variant="hero"
        interval={6000}
        overlay={
          <div className="px-6 pb-12 pt-4 text-center md:pb-16">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl">
              Vacation Bungalows in Thane
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 drop-shadow md:text-lg">
              Two spacious bungalows with large lawns, fully equipped kitchens,
              and room for up to 50 guests. Perfect for family gatherings, parties, and weekend getaways.
            </p>
            <Link
              to="/property/tripti-bungalow-15"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              View Properties
            </Link>
          </div>
        }
      />

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
                  <ImageSlideshow
                    images={property.photos ?? []}
                    alt={property.name}
                    variant="card"
                    interval={0}
                  />
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatCurrency(property.ratePerNight)}/night · Up to{' '}
                      {property.maxGuests} guests
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {property.amenities.map((a) => (
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
