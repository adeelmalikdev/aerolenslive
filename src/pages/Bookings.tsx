import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, CheckCircle, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useBookings, Booking } from '@/hooks/useBookings';

export default function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading, checkIn } = useBookings();
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

  if (authLoading || loading) {
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
            <p className="text-muted-foreground">Manage your flight reservations</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Ticket className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
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
              <BookingCard key={booking.id} booking={booking} onCheckIn={handleCheckIn} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

interface BookingCardProps {
  booking: Booking;
  onCheckIn: (id: string) => Promise<void>;
}

function BookingCard({ booking, onCheckIn }: BookingCardProps) {
  const flightData = booking.flight_data as Record<string, unknown>;
  const origin = (flightData?.origin as string) || 'N/A';
  const destination = (flightData?.destination as string) || 'N/A';
  const airline = (flightData?.airline as string) || 'Unknown Airline';
  const flightNumber = (flightData?.flightNumber as string) || '';
  const departureTime = flightData?.departureTime as string;
  const arrivalTime = flightData?.arrivalTime as string;
  const price = flightData?.price as number;

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

        {booking.status === 'confirmed' && (
          <div className="mt-6 pt-4 border-t flex justify-end">
            <Button onClick={() => onCheckIn(booking.id)} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Check In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
