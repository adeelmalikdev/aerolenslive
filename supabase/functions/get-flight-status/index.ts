import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusFlightPoint {
  iataCode: string;
  terminal?: string;
  gate?: string;
}

interface AmadeusFlightSegment {
  departure: AmadeusFlightPoint & { scheduledTime: string };
  arrival: AmadeusFlightPoint & { scheduledTime: string };
}

interface AmadeusFlightStatus {
  type: string;
  scheduledDepartureDate: string;
  flightDesignator: {
    carrierCode: string;
    flightNumber: number;
  };
  flightPoints: Array<{
    iataCode: string;
    departure?: {
      timings?: Array<{ qualifier: string; value: string }>;
      terminal?: { code: string };
      gate?: { mainGate: string };
    };
    arrival?: {
      timings?: Array<{ qualifier: string; value: string }>;
      terminal?: { code: string };
      gate?: { mainGate: string };
    };
  }>;
  segments?: AmadeusFlightSegment[];
  legs?: Array<{
    boardPointIataCode: string;
    offPointIataCode: string;
    aircraftEquipment?: { aircraftType: string };
    scheduledLegDuration?: string;
  }>;
}

// Map airline codes to names
const airlineNames: Record<string, string> = {
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'BA': 'British Airways',
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'KL': 'KLM',
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'JL': 'Japan Airlines',
  'NH': 'All Nippon Airways',
  'QF': 'Qantas',
  'AC': 'Air Canada',
  'LX': 'Swiss',
  'TK': 'Turkish Airlines',
  'EY': 'Etihad Airways',
  'VS': 'Virgin Atlantic',
  'IB': 'Iberia',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { carrierCode, flightNumber, scheduledDepartureDate } = await req.json();

    if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: carrierCode, flightNumber, scheduledDepartureDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching flight status for ${carrierCode}${flightNumber} on ${scheduledDepartureDate}`);

    // Get Amadeus access token via internal auth function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authResponse = await supabase.functions.invoke('amadeus-auth', {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (authResponse.error || !authResponse.data?.access_token) {
      console.error('Failed to get Amadeus token:', authResponse.error);
      throw new Error('Failed to authenticate with flight data provider');
    }

    const accessToken = authResponse.data.access_token;

    // Call Amadeus Flight Status API
    const amadeusUrl = new URL('https://test.api.amadeus.com/v2/schedule/flights');
    amadeusUrl.searchParams.set('carrierCode', carrierCode.toUpperCase());
    amadeusUrl.searchParams.set('flightNumber', flightNumber.toString());
    amadeusUrl.searchParams.set('scheduledDepartureDate', scheduledDepartureDate);

    console.log('Calling Amadeus API:', amadeusUrl.toString());

    const flightResponse = await fetch(amadeusUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!flightResponse.ok) {
      const errorText = await flightResponse.text();
      console.error('Amadeus API error:', flightResponse.status, errorText);
      
      if (flightResponse.status === 404) {
        return new Response(
          JSON.stringify({ data: null, message: 'Flight not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Flight data provider error: ${flightResponse.status}`);
    }

    const amadeusData = await flightResponse.json();
    console.log('Amadeus response:', JSON.stringify(amadeusData, null, 2));

    if (!amadeusData.data || amadeusData.data.length === 0) {
      return new Response(
        JSON.stringify({ data: null, message: 'No flight data available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform Amadeus response to our format
    const flight: AmadeusFlightStatus = amadeusData.data[0];
    const flightPoints = flight.flightPoints || [];
    
    const departurePoint = flightPoints.find(p => p.departure);
    const arrivalPoint = flightPoints.find(p => p.arrival);

    // Get scheduled times
    const getDepartureTime = () => {
      const timing = departurePoint?.departure?.timings?.find(t => t.qualifier === 'STD');
      return timing?.value || `${scheduledDepartureDate}T00:00:00`;
    };

    const getArrivalTime = () => {
      const timing = arrivalPoint?.arrival?.timings?.find(t => t.qualifier === 'STA');
      return timing?.value || `${scheduledDepartureDate}T00:00:00`;
    };

    // Determine status based on available data
    const determineStatus = (): 'on_time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived' => {
      // Check for actual times vs scheduled to determine if delayed
      const actualDep = departurePoint?.departure?.timings?.find(t => t.qualifier === 'ATD');
      const actualArr = arrivalPoint?.arrival?.timings?.find(t => t.qualifier === 'ATA');
      
      if (actualArr) return 'arrived';
      if (actualDep) return 'departed';
      
      // Check if there's a delay
      const estimatedDep = departurePoint?.departure?.timings?.find(t => t.qualifier === 'ETD');
      const scheduledDep = departurePoint?.departure?.timings?.find(t => t.qualifier === 'STD');
      
      if (estimatedDep && scheduledDep) {
        const estimated = new Date(estimatedDep.value).getTime();
        const scheduled = new Date(scheduledDep.value).getTime();
        if (estimated > scheduled + 15 * 60 * 1000) { // More than 15 min delay
          return 'delayed';
        }
      }
      
      return 'on_time';
    };

    // Calculate delay in minutes
    const calculateDelay = (): number | undefined => {
      const estimatedDep = departurePoint?.departure?.timings?.find(t => t.qualifier === 'ETD');
      const scheduledDep = departurePoint?.departure?.timings?.find(t => t.qualifier === 'STD');
      
      if (estimatedDep && scheduledDep) {
        const estimated = new Date(estimatedDep.value).getTime();
        const scheduled = new Date(scheduledDep.value).getTime();
        const delayMs = estimated - scheduled;
        if (delayMs > 0) {
          return Math.round(delayMs / 60000);
        }
      }
      return undefined;
    };

    const fullCarrierCode = flight.flightDesignator.carrierCode;
    const airlineName = airlineNames[fullCarrierCode] || fullCarrierCode;

    const flightStatus = {
      flightNumber: `${fullCarrierCode}${flight.flightDesignator.flightNumber}`,
      airline: airlineName,
      origin: departurePoint?.iataCode || flightPoints[0]?.iataCode || 'Unknown',
      destination: arrivalPoint?.iataCode || flightPoints[flightPoints.length - 1]?.iataCode || 'Unknown',
      scheduledDeparture: getDepartureTime(),
      scheduledArrival: getArrivalTime(),
      status: determineStatus(),
      gate: departurePoint?.departure?.gate?.mainGate,
      terminal: departurePoint?.departure?.terminal?.code,
      delay: calculateDelay(),
    };

    console.log('Transformed flight status:', flightStatus);

    return new Response(
      JSON.stringify({ data: flightStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-flight-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
