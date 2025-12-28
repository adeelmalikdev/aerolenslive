import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FlightStatus {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  status: 'on_time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived';
  gate?: string;
  terminal?: string;
  delay?: number;
}

interface UseFlightStatusResult {
  flightStatus: FlightStatus | null;
  isLoading: boolean;
  searched: boolean;
  searchFlight: (flightNumber: string, date: Date) => Promise<void>;
  reset: () => void;
}

export function useFlightStatus(): UseFlightStatusResult {
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const parseFlightNumber = (flightNumber: string): { carrierCode: string; flightNumber: string } | null => {
    // Remove spaces and convert to uppercase
    const normalized = flightNumber.toUpperCase().replace(/\s/g, '');
    
    // Match pattern: 2-3 letter carrier code + numeric flight number
    const match = normalized.match(/^([A-Z]{2,3})(\d+)$/);
    
    if (!match) {
      return null;
    }

    return {
      carrierCode: match[1],
      flightNumber: match[2],
    };
  };

  const searchFlight = async (flightNumber: string, date: Date) => {
    const parsed = parseFlightNumber(flightNumber);
    
    if (!parsed) {
      toast.error('Invalid flight number format. Use format like AA100 or BA1234.');
      return;
    }

    setIsLoading(true);
    setSearched(false);

    try {
      const scheduledDepartureDate = date.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('get-flight-status', {
        body: {
          carrierCode: parsed.carrierCode,
          flightNumber: parsed.flightNumber,
          scheduledDepartureDate,
        },
      });

      if (error) {
        console.error('Flight status error:', error);
        toast.error('Failed to fetch flight status. Please try again.');
        setFlightStatus(null);
      } else if (data?.data) {
        setFlightStatus(data.data);
      } else {
        setFlightStatus(null);
      }
    } catch (error) {
      console.error('Error fetching flight status:', error);
      toast.error('An error occurred while checking flight status.');
      setFlightStatus(null);
    } finally {
      setIsLoading(true);
      setSearched(true);
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFlightStatus(null);
    setSearched(false);
  };

  return {
    flightStatus,
    isLoading,
    searched,
    searchFlight,
    reset,
  };
}
