import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface HotelBooking {
  id: string;
  user_id: string;
  booking_reference: string;
  hotel_data: Record<string, unknown>;
  guest_last_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  created_at: string;
}

function generateBookingReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'HTL';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useHotelBookings() {
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as HotelBooking[]) || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('hotel-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotel_bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBookings]);

  const createBooking = async (
    hotelData: Record<string, unknown>,
    guestLastName: string,
    checkInDate: string,
    checkOutDate: string,
    userEmail?: string,
    userName?: string
  ): Promise<HotelBooking | null> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to book a hotel.',
        variant: 'destructive',
      });
      return null;
    }

    if (!guestLastName.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter guest last name.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const bookingReference = generateBookingReference();
      
      const { data, error } = await supabase
        .from('hotel_bookings')
        .insert([{
          user_id: user.id,
          booking_reference: bookingReference,
          hotel_data: hotelData as unknown as Record<string, never>,
          guest_last_name: guestLastName.trim(),
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          status: 'confirmed',
        }])
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      if (userEmail) {
        try {
          const checkIn = new Date(checkInDate);
          const checkOut = new Date(checkOutDate);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

          await supabase.functions.invoke('send-hotel-booking-confirmation', {
            body: {
              to: userEmail,
              userName: userName || guestLastName,
              bookingReference,
              guestName: guestLastName,
              hotelName: String(hotelData.hotelName || 'Hotel'),
              hotelAddress: String(hotelData.hotelAddress || ''),
              checkInDate: checkIn.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
              checkOutDate: checkOut.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
              roomType: String(hotelData.roomType || ''),
              totalPrice: String(hotelData.price || '0'),
              currency: String(hotelData.currency || 'USD'),
              nights,
            },
          });
          console.log('Hotel booking confirmation email sent');
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }

      toast({
        title: 'Hotel Booking Confirmed!',
        description: `Your confirmation number is ${bookingReference}. Check your email for details.`,
      });

      await fetchBookings();
      return data as HotelBooking;
    } catch (err) {
      console.error('Hotel booking error:', err);
      toast({
        title: 'Booking Failed',
        description: 'Unable to complete your booking. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    createBooking,
    refetch: fetchBookings,
  };
}
