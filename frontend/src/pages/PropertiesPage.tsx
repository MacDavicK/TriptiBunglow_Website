import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/useProperties';
import { formatCurrency } from '@/utils/format-currency';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ImageSlideshow } from '@/components/ui/ImageSlideshow';
import { PLACEHOLDER_IMAGES_NO_15, PLACEHOLDER_IMAGES_NO_14 } from '@/utils/placeholder-images';
import type { PropertyListItem } from '@shared/types';

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

function getPlaceholderImages(slug: string): string[] {
  return slug === 'tripti-bungalow-15' ? PLACEHOLDER_IMAGES_NO_15 : PLACEHOLDER_IMAGES_NO_14;
}

export function PropertiesPage() {
  const { data: properties, isLoading, error, refetch } = useProperties();
  const list = (properties as PropertyListItem[] | undefined) ?? PLACEHOLDER_PROPERTIES;

  return (
    <PageContainer>
      <section className="py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Our Properties
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Two premium vacation bungalows in Thane, Maharashtra
          </p>
        </div>

        {error && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Failed to load properties'}
            onRetry={() => refetch()}
            className="mt-6"
          />
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            : list.map((property) => (
                <Card key={property._id} className="overflow-hidden">
                  <ImageSlideshow
                    images={property.photos?.length ? property.photos : getPlaceholderImages(property.slug)}
                    alt={property.name}
                    variant="card"
                    interval={0}
                  />
                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-gray-900">{property.name}</h2>
                    <p className="mt-2 text-base text-gray-600">
                      {formatCurrency(property.ratePerNight)}/night · Up to {property.maxGuests} guests
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {property.amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link to={`/property/${property.slug}`}>
                        <Button variant="secondary">View Details</Button>
                      </Link>
                      <Link to={`/book/${property.slug}`}>
                        <Button variant="primary">Book Now</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
        </div>

        {list.length === 2 && (
          <div className="mt-12 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-8 text-center">
            <h3 className="text-xl font-bold text-indigo-900">
              Planning a wedding or large event?
            </h3>
            <p className="mt-2 text-indigo-700">
              Book both bungalows together — accommodates up to 100 guests with two lawns,
              two kitchens, and plenty of space.
            </p>
            <Link
              to={`/book/${list[0]?.slug || 'tripti-bungalow-15'}?both=true`}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-indigo-700"
            >
              Book Both Bungalows
            </Link>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
