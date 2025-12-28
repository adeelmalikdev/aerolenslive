import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plane, Clock, Luggage, Info, X, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlightOffer, FlightItinerary } from '@/types/flight';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BookingSuccessModal } from './BookingSuccessModal';

interface FlightDetailsModalProps {
  flight: FlightOffer | null;
  dictionaries?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originCode?: string;
  destinationCode?: string;
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] || '0';
  const minutes = match[2] || '0';
  return `${hours}h ${minutes}m`;
}

function SegmentDetails({
  segment,
  dictionaries,
  fareDetails,
}: {
  segment: any;
  dictionaries?: any;
  fareDetails?: any;
}) {
  const carrierName = dictionaries?.carriers?.[segment.carrierCode] || segment.carrierCode;
  const aircraftName = dictionaries?.aircraft?.[segment.aircraft?.code] || segment.aircraft?.code;

  return (
    <div className="flex gap-4 py-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Plane className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 w-px bg-border my-2" />
        <div className="w-3 h-3 rounded-full bg-primary" />
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <p className="text-lg font-semibold">
            {format(parseISO(segment.departure.at), 'HH:mm')}
          </p>
          <p className="text-sm text-muted-foreground">
            {segment.departure.iataCode}
            {segment.departure.terminal && ` • Terminal ${segment.departure.terminal}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(segment.departure.at), 'EEE, MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{parseDuration(segment.duration)}</span>
          <span>•</span>
          <span>
            {carrierName} {segment.carrierCode}
            {segment.number}
          </span>
          {aircraftName && (
            <>
              <span>•</span>
              <span>{aircraftName}</span>
            </>
          )}
        </div>

        {fareDetails && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {fareDetails.cabin?.toLowerCase().replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">Class {fareDetails.class}</span>
          </div>
        )}

        <div>
          <p className="text-lg font-semibold">
            {format(parseISO(segment.arrival.at), 'HH:mm')}
          </p>
          <p className="text-sm text-muted-foreground">
            {segment.arrival.iataCode}
            {segment.arrival.terminal && ` • Terminal ${segment.arrival.terminal}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ItineraryDetails({
  itinerary,
  dictionaries,
  fareDetailsBySegment,
  label,
}: {
  itinerary: FlightItinerary;
  dictionaries?: any;
  fareDetailsBySegment?: any[];
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{label}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Total: {parseDuration(itinerary.duration)}</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {itinerary.segments.map((segment, idx) => {
          const fareDetails = fareDetailsBySegment?.find(
            (f) => f.segmentId === String(idx + 1) || f.segmentId === segment.number
          );
          return (
            <SegmentDetails
              key={idx}
              segment={segment}
              dictionaries={dictionaries}
              fareDetails={fareDetails}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FlightDetailsModal({
  flight,
  dictionaries,
  open,
  onOpenChange,
  originCode,
  destinationCode,
}: FlightDetailsModalProps) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [lastName, setLastName] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingData, setBookingData] = useState<{
    bookingReference: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    cabinClass: string;
    passengerName: string;
  } | null>(null);
  const { createBooking, loading: bookingLoading } = useBookings();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!flight) return null;

  const isRoundTrip = flight.itineraries.length > 1;
  const travelerPricing = flight.travelerPricings[0];
  const checkedBagsIncluded = flight.pricingOptions?.includedCheckedBagsOnly;
  
  const firstSegment = flight.itineraries[0].segments[0];
  const carrierName = dictionaries?.carriers?.[firstSegment.carrierCode] || firstSegment.carrierCode;

  const handleBook = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!lastName.trim()) return;

    const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
    const cabin = travelerPricing?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';
    const flightNum = `${firstSegment.carrierCode}${firstSegment.number}`;
    const flightOrigin = originCode || firstSegment.departure.iataCode;
    const flightDest = destinationCode || lastSegment.arrival.iataCode;
    const cabinClass = cabin.toLowerCase().replace('_', ' ');

    const flightData = {
      airline: carrierName,
      flightNumber: flightNum,
      origin: flightOrigin,
      destination: flightDest,
      departureTime: firstSegment.departure.at,
      arrivalTime: lastSegment.arrival.at,
      duration: parseDuration(flight.itineraries[0].duration),
      price: parseFloat(flight.price.grandTotal),
      cabinClass,
    };

    const booking = await createBooking(
      flightData, 
      lastName, 
      user.email, 
      user.user_metadata?.full_name || lastName
    );
    if (booking) {
      setBookingData({
        bookingReference: booking.booking_reference,
        flightNumber: flightNum,
        airline: carrierName,
        origin: flightOrigin,
        destination: flightDest,
        departureTime: firstSegment.departure.at,
        arrivalTime: lastSegment.arrival.at,
        cabinClass,
        passengerName: lastName,
      });
      setShowBookingForm(false);
      setLastName('');
      onOpenChange(false);
      setShowSuccessModal(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flight Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Outbound */}
            <ItineraryDetails
              itinerary={flight.itineraries[0]}
              dictionaries={dictionaries}
              fareDetailsBySegment={travelerPricing?.fareDetailsBySegment}
              label="Outbound Flight"
            />

          {/* Return */}
          {isRoundTrip && (
            <>
              <Separator />
              <ItineraryDetails
                itinerary={flight.itineraries[1]}
                dictionaries={dictionaries}
                fareDetailsBySegment={travelerPricing?.fareDetailsBySegment}
                label="Return Flight"
              />
            </>
          )}

          <Separator />

          {/* Price & Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total price per person</p>
                <p className="text-3xl font-bold text-primary">
                  ${parseFloat(flight.price.grandTotal).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Base fare</p>
                <p className="text-lg">${parseFloat(flight.price.base).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Luggage className="h-4 w-4" />
                <span>{checkedBagsIncluded ? 'Checked bag included' : 'No checked bag'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>{flight.numberOfBookableSeats} seats left</span>
              </div>
            </div>

            {showBookingForm ? (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="passenger-name">Passenger Last Name</Label>
                  <Input
                    id="passenger-name"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBook} 
                    disabled={bookingLoading || !lastName.trim()}
                    className="flex-1"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => user ? setShowBookingForm(true) : navigate('/auth')}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  {user ? 'Book This Flight' : 'Sign in to Book'}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Last ticketing date: {flight.lastTicketingDate}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {bookingData && (
      <BookingSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        {...bookingData}
      />
    )}
  </>
  );
}
