import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Users, ArrowRightLeft, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AirportInput } from './AirportInput';
import { Airport, FlightSearchParams } from '@/types/flight';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface FlightSearchFormProps {
  onSearch: (params: FlightSearchParams) => void;
  onSaveSearch?: (origin: Airport, destination: Airport) => void;
  loading?: boolean;
  initialOrigin?: string;
  initialDestination?: string;
}

export function FlightSearchForm({ 
  onSearch, 
  onSaveSearch,
  loading,
  initialOrigin,
  initialDestination 
}: FlightSearchFormProps) {
  const { user } = useAuth();
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'>('ECONOMY');
  const [passengersOpen, setPassengersOpen] = useState(false);

  // Handle URL-based initial values
  useEffect(() => {
    if (initialOrigin && !origin) {
      setOrigin({ iataCode: initialOrigin, name: initialOrigin });
    }
    if (initialDestination && !destination) {
      setDestination({ iataCode: initialDestination, name: initialDestination });
    }
  }, [initialOrigin, initialDestination]);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) return;

    onSearch({
      origin: origin.iataCode,
      destination: destination.iataCode,
      departureDate: format(departureDate, 'yyyy-MM-dd'),
      returnDate: returnDate ? format(returnDate, 'yyyy-MM-dd') : undefined,
      adults,
      children,
      infants,
      cabinClass,
      tripType,
    });
  };

  const totalPassengers = adults + children + infants;
  const isValid = origin && destination && departureDate && (tripType === 'one-way' || returnDate);
  const canSave = origin && destination && user && onSaveSearch;

  const handleSaveSearch = () => {
    if (origin && destination && onSaveSearch) {
      onSaveSearch(origin, destination);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Tabs value={tripType} onValueChange={(v) => setTripType(v as any)}>
        <TabsList className="bg-muted/50 h-10">
          <TabsTrigger value="round-trip" className="data-[state=active]:bg-background">Round Trip</TabsTrigger>
          <TabsTrigger value="one-way" className="data-[state=active]:bg-background">One Way</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Row 1: Origin, Destination, Dates */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Origin & Destination */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <AirportInput
              value={origin}
              onChange={setOrigin}
              placeholder="Where from?"
              icon="departure"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapAirports}
              className="shrink-0 self-center rotate-90 sm:rotate-0"
              aria-label="Swap origin and destination"
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <AirportInput
              value={destination}
              onChange={setDestination}
              placeholder="Where to?"
              icon="arrival"
              className="flex-1"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 sm:h-12 justify-start text-left font-normal text-xs sm:text-sm",
                    !departureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{departureDate ? format(departureDate, "MMM d") : "Departure"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={setDepartureDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>

            {tripType === 'round-trip' ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 sm:h-12 justify-start text-left font-normal text-xs sm:text-sm",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{returnDate ? format(returnDate, "MMM d") : "Return"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    initialFocus
                    disabled={(date) => date < (departureDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div /> /* Empty placeholder for grid alignment */
            )}
          </div>

          {/* Passengers */}
          <div className="w-full">
            <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-11 sm:h-12 justify-start text-xs sm:text-sm">
                  <Users className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                  {totalPassengers} {totalPassengers === 1 ? 'Traveler' : 'Travelers'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Adults</p>
                      <p className="text-sm text-muted-foreground">12+ years</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1}
                        aria-label="Decrease adults"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center" aria-live="polite">{adults}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        disabled={adults >= 9}
                        aria-label="Increase adults"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Children</p>
                      <p className="text-sm text-muted-foreground">2-11 years</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0}
                        aria-label="Decrease children"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center" aria-live="polite">{children}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChildren(Math.min(9, children + 1))}
                        disabled={children >= 9}
                        aria-label="Increase children"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Infants</p>
                      <p className="text-sm text-muted-foreground">Under 2 years</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInfants(Math.max(0, infants - 1))}
                        disabled={infants <= 0}
                        aria-label="Decrease infants"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center" aria-live="polite">{infants}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInfants(Math.min(adults, infants + 1))}
                        disabled={infants >= adults}
                        aria-label="Increase infants"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Select value={cabinClass} onValueChange={(v: any) => setCabinClass(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ECONOMY">Economy</SelectItem>
                        <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                        <SelectItem value="FIRST">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Row 2: Search Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={!isValid || loading}
            className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search Flights'}
          </Button>
          
          {canSave && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSaveSearch}
              className="h-11 w-11 sm:h-12 sm:w-12"
              title="Save this route"
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
