import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { lastNameSchema, validateWithMessage, isValidationError } from '@/lib/validation';

export interface Booking {
  id: string;
  user_id: string;
  booking_reference: string;
  flight_data: Record<string, unknown>;
  passenger_last_name: string;
  created_at: string;
  status: 'confirmed' | 'cancelled' | 'checked_in';
}

function generateBookingReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as Booking[]) || []);
    } catch {
      // Silent fail for fetch - user will see empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Realtime subscription for bookings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Booking change received:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBookings]);

  const createBooking = async (
    flightData: Record<string, unknown>,
    passengerLastName: string,
    userEmail?: string,
    userName?: string
  ): Promise<Booking | null> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to book a flight.',
        variant: 'destructive',
      });
      return null;
    }

    const nameValidation = validateWithMessage(lastNameSchema, passengerLastName);
    if (isValidationError(nameValidation)) {
      toast({
        title: 'Invalid Input',
        description: nameValidation.error,
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const bookingReference = generateBookingReference();
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          booking_reference: bookingReference,
          flight_data: flightData as unknown as Record<string, never>,
          passenger_last_name: nameValidation.data,
          status: 'confirmed',
        }])
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email if user email is available
      if (userEmail) {
        try {
          const segments = [{
            departure: String(flightData.origin || ''),
            arrival: String(flightData.destination || ''),
            departureTime: String(flightData.departureTime || ''),
            arrivalTime: String(flightData.arrivalTime || ''),
            airline: String(flightData.airline || ''),
            flightNumber: String(flightData.flightNumber || ''),
            duration: String(flightData.duration || ''),
          }];

          await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              to: userEmail,
              userName: userName || nameValidation.data,
              bookingReference,
              passengerName: nameValidation.data,
              segments,
              totalPrice: String(flightData.price || '0'),
              currency: 'USD',
              cabinClass: String(flightData.cabinClass || 'Economy'),
            },
          });
          console.log('Booking confirmation email sent');
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the booking if email fails
        }
      }

      toast({
        title: 'Booking Confirmed!',
        description: `Your booking reference is ${bookingReference}. Check your email for confirmation.`,
      });

      await fetchBookings();
      return data as Booking;
    } catch {
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

  const findBooking = async (
    bookingReference: string,
    lastName: string
  ): Promise<Booking | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', bookingReference.toUpperCase())
        .ilike('passenger_last_name', lastName)
        .maybeSingle();

      if (error) throw error;
      return data as Booking | null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async (
    bookingId: string,
    userEmail?: string,
    userName?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Get the booking details first
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId);

      if (error) throw error;

      // Send check-in confirmation email
      if (userEmail && booking) {
        try {
          const flightData = booking.flight_data as Record<string, unknown>;
          await supabase.functions.invoke('send-checkin-confirmation', {
            body: {
              to: userEmail,
              userName: userName || booking.passenger_last_name,
              bookingReference: booking.booking_reference,
              passengerName: booking.passenger_last_name,
              origin: String(flightData.origin || ''),
              destination: String(flightData.destination || ''),
              departureTime: String(flightData.departureTime || ''),
              airline: String(flightData.airline || ''),
              flightNumber: String(flightData.flightNumber || ''),
            },
          });
          console.log('Check-in confirmation email sent');
        } catch (emailError) {
          console.error('Failed to send check-in email:', emailError);
        }
      }

      toast({
        title: 'Check-in Complete',
        description: 'You have successfully checked in for your flight. Check your email for confirmation.',
      });

      await fetchBookings();
      return true;
    } catch {
      toast({
        title: 'Check-in Failed',
        description: 'Unable to complete check-in. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    createBooking,
    findBooking,
    checkIn,
    refetch: fetchBookings,
  };
}
