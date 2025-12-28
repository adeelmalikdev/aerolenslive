import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Clock, CheckCircle, AlertTriangle, BedDouble } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HotelReservation {
  confirmationNumber: string;
  hotelName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  roomNumber?: string;
  specialRequests?: string;
}

export function HotelStatusForm() {
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [reservation, setReservation] = useState<HotelReservation | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationNumber.trim()) return;

    setLoading(true);
    setReservation(null);
    
    try {
      const normalizedCode = confirmationNumber.toUpperCase().replace(/\s/g, '');
      
      let query = supabase
        .from('hotel_bookings')
        .select('*')
        .eq('booking_reference', normalizedCode);
      
      // If last name is provided, also filter by it
      if (lastName.trim()) {
        query = query.ilike('guest_last_name', lastName.trim());
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error fetching reservation:', error);
        toast.error('Failed to fetch reservation. Please try again.');
        setSearched(true);
        setLoading(false);
        return;
      }
      
      if (data) {
        const hotelData = data.hotel_data as any;
        const reservation: HotelReservation = {
          confirmationNumber: data.booking_reference,
          hotelName: hotelData?.hotel?.name || hotelData?.hotelName || 'Hotel',
          guestName: data.guest_last_name,
          checkIn: data.check_in_date,
          checkOut: data.check_out_date,
          roomType: hotelData?.offer?.room?.typeEstimated?.category || hotelData?.roomType || 'Standard Room',
          status: data.status as HotelReservation['status'],
          roomNumber: hotelData?.roomNumber,
          specialRequests: hotelData?.specialRequests,
        };
        setReservation(reservation);
      }
      
      setSearched(true);
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: HotelReservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'checked_out':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
      case 'no_show':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: HotelReservation['status']) => {
    switch (status) {
      case 'confirmed':
        return <Clock className="h-4 w-4" />;
      case 'checked_in':
        return <CheckCircle className="h-4 w-4" />;
      case 'checked_out':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'no_show':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const formatStatusLabel = (status: HotelReservation['status']) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation-number">Confirmation Number</Label>
            <Input
              id="confirmation-number"
              placeholder="e.g., HTL123456"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-lastname">Guest Last Name (Optional)</Label>
            <Input
              id="guest-lastname"
              placeholder="e.g., Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={loading || !confirmationNumber}>
          {loading ? 'Checking...' : 'Check Reservation Status'}
        </Button>
      </form>

      {searched && !reservation && (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            No reservation found with that confirmation number. Please check and try again.
          </p>
        </div>
      )}

      {reservation && (
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">{reservation.hotelName}</span>
            </div>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5',
              getStatusColor(reservation.status)
            )}>
              {getStatusIcon(reservation.status)}
              {formatStatusLabel(reservation.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p className="font-semibold text-lg">{format(new Date(reservation.checkIn), 'PPP')}</p>
              <p className="text-sm text-muted-foreground">After 3:00 PM</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Check-out</p>
              <p className="font-semibold text-lg">{format(new Date(reservation.checkOut), 'PPP')}</p>
              <p className="text-sm text-muted-foreground">Before 11:00 AM</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Guest Name</p>
              <p className="font-semibold">{reservation.guestName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Room Type</p>
              <div className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{reservation.roomType}</span>
              </div>
            </div>
            {reservation.roomNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Room Number</p>
                <p className="font-semibold">{reservation.roomNumber}</p>
              </div>
            )}
          </div>

          {reservation.specialRequests && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Special Requests</p>
              <p className="text-sm">{reservation.specialRequests}</p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium">Confirmation Number</p>
            <p className="text-lg font-mono font-bold text-primary">{reservation.confirmationNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
}
