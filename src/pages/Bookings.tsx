import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, CheckCircle, Ticket, Download, Loader2, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useBookings, Booking } from '@/hooks/useBookings';
import { useHotelBookings, HotelBooking } from '@/hooks/useHotelBookings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading: flightsLoading, checkIn } = useBookings();
  const { bookings: hotelBookings, loading: hotelsLoading } = useHotelBookings();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'My Bookings - AeroLens';
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCheckIn = async (bookingId: string) => {
    await checkIn(
      bookingId,
      user?.email || undefined,
      user?.user_metadata?.full_name || undefined
    );
  };

  const loading = authLoading || flightsLoading || hotelsLoading;

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
            <p className="text-muted-foreground">Manage your travel reservations</p>
          </div>
        </div>

        <Tabs defaultValue="flights" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="flights" className="gap-2">
              <Plane className="h-4 w-4" />
              Flights
              {bookings.length > 0 && (
                <Badge variant="secondary" className="ml-1">{bookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-2">
              <Building2 className="h-4 w-4" />
              Hotels
              {hotelBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1">{hotelBookings.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Plane className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No flight bookings yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Search for flights and book your next adventure
                  </p>
                  <Button asChild>
                    <Link to="/">Search Flights</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <FlightBookingCard key={booking.id} booking={booking} onCheckIn={handleCheckIn} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hotels">
            {hotelBookings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No hotel bookings yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Search for hotels and book your perfect stay
                  </p>
                  <Button asChild>
                    <Link to="/hotels">Search Hotels</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {hotelBookings.map((booking) => (
                  <HotelBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

interface FlightBookingCardProps {
  booking: Booking;
  onCheckIn: (id: string) => Promise<void>;
}

function FlightBookingCard({ booking, onCheckIn }: FlightBookingCardProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  
  const flightData = booking.flight_data as Record<string, unknown>;
  const origin = (flightData?.origin as string) || 'N/A';
  const destination = (flightData?.destination as string) || 'N/A';
  const airline = (flightData?.airline as string) || 'Unknown Airline';
  const flightNumber = (flightData?.flightNumber as string) || '';
  const departureTime = flightData?.departureTime as string;
  const arrivalTime = flightData?.arrivalTime as string;
  const price = flightData?.price as number;
  const cabinClass = (flightData?.cabinClass as string) || 'Economy';

  const downloadBoardingPass = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-boarding-pass', {
        body: {
          bookingReference: booking.booking_reference,
          passengerName: booking.passenger_last_name,
          flightNumber,
          airline,
          origin,
          destination,
          departureTime,
          arrivalTime,
          cabinClass,
        },
      });

      if (error) throw error;

      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Downloaded!',
        description: 'Your boarding pass has been downloaded.',
      });
    } catch (error) {
      console.error('Failed to download boarding pass:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to generate boarding pass. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Confirmed</Badge>;
      case 'checked_in':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Checked In</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{booking.status}</Badge>;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'HH:mm');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {airline}
              {flightNumber && <span className="text-muted-foreground font-normal text-sm">{flightNumber}</span>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Booked on {format(new Date(booking.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Flight Route */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{origin}</p>
              {departureTime && (
                <p className="text-sm text-muted-foreground">{formatTime(departureTime)}</p>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
              <Plane className="h-5 w-5 text-primary" />
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{destination}</p>
              {arrivalTime && (
                <p className="text-sm text-muted-foreground">{formatTime(arrivalTime)}</p>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booking Reference</span>
              <span className="font-mono font-semibold">{booking.booking_reference}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Passenger</span>
              <span className="font-medium">{booking.passenger_last_name}</span>
            </div>
            {departureTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Departure</span>
                <span>{formatDateTime(departureTime)}</span>
              </div>
            )}
            {price && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">${price}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={downloadBoardingPass} 
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Boarding Pass
          </Button>
          {booking.status === 'confirmed' && (
            <Button onClick={() => onCheckIn(booking.id)} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Check In
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface HotelBookingCardProps {
  booking: HotelBooking;
}

function HotelBookingCard({ booking }: HotelBookingCardProps) {
  const hotelData = booking.hotel_data as Record<string, unknown>;
  const hotelName = (hotelData?.hotelName as string) || 'Hotel';
  const hotelAddress = (hotelData?.hotelAddress as string) || '';
  const roomType = (hotelData?.roomType as string) || '';
  const price = hotelData?.price as number;
  const currency = (hotelData?.currency as string) || 'USD';

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Confirmed</Badge>;
      case 'checked_in':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Checked In</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{booking.status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getNights = () => {
    try {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 1;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {hotelName}
            </CardTitle>
            {hotelAddress && (
              <p className="text-sm text-muted-foreground">{hotelAddress}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Stay Duration */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p className="font-semibold">{formatDate(booking.check_in_date)}</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">{getNights()} night{getNights() > 1 ? 's' : ''}</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Check-out</p>
              <p className="font-semibold">{formatDate(booking.check_out_date)}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booking Reference</span>
              <span className="font-mono font-semibold">{booking.booking_reference}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Guest</span>
              <span className="font-medium">{booking.guest_last_name}</span>
            </div>
            {roomType && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Room Type</span>
                <span>{roomType}</span>
              </div>
            )}
            {price && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Price</span>
                <span className="font-semibold">{currency === 'USD' ? '$' : currency}{price}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Booked on {format(new Date(booking.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}