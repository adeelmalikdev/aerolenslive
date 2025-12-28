import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import parisImage from '@/assets/destination-paris.jpg';
import rioImage from '@/assets/destination-rio.jpg';
import londonImage from '@/assets/destination-london.jpg';
import tokyoImage from '@/assets/destination-tokyo.jpg';

const destinations = [
  {
    id: 1,
    city: 'Paris',
    country: 'France',
    image: parisImage,
    dates: '20 May 2025 - 30 May 2025',
    priceRange: '$800 - $1200',
    code: 'CDG',
  },
  {
    id: 2,
    city: 'Rio de Janeiro',
    country: 'Brazil',
    image: rioImage,
    dates: '15 Jun 2025 - 25 Jun 2025',
    priceRange: '$1000 - $1500',
    code: 'GIG',
  },
  {
    id: 3,
    city: 'London',
    country: 'United Kingdom',
    image: londonImage,
    dates: '10 Jul 2025 - 20 Jul 2025',
    priceRange: '$700 - $1100',
    code: 'LHR',
  },
  {
    id: 4,
    city: 'Tokyo',
    country: 'Japan',
    image: tokyoImage,
    dates: '5 Aug 2025 - 15 Aug 2025',
    priceRange: '$1200 - $1800',
    code: 'NRT',
  },
];

interface FeaturedDestinationsProps {
  onSelectDestination?: (code: string) => void;
}

export function FeaturedDestinations({ onSelectDestination }: FeaturedDestinationsProps) {
  return (
    <section className="py-10 sm:py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Featured Destinations
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-10">
          Explore our most popular flight routes
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {destinations.map((dest) => (
            <Card 
              key={dest.id} 
              className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => onSelectDestination?.(dest.code)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={`${dest.city}, ${dest.country}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-primary">
                  {dest.city}, {dest.country}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{dest.dates}</p>
                <p className="font-bold text-foreground mt-2">{dest.priceRange}</p>
                <div className="flex items-center gap-1 text-primary text-sm mt-3 group-hover:gap-2 transition-all">
                  <span>View flights</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}