import { Hotel, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ServicesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            More Than Just Flights
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Complete your travel experience with our hotel booking service
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card 
            className="group text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer"
            onClick={() => navigate('/hotels')}
          >
            <CardContent className="p-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Hotel className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-3">
                Hotel Booking
              </h3>
              <p className="text-muted-foreground mb-6">
                Search and book hotels worldwide with exclusive deals and discounts. Find the perfect accommodation for your trip.
              </p>
              <Button 
                variant="default" 
                className="group-hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/hotels');
                }}
              >
                Search Hotels <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
