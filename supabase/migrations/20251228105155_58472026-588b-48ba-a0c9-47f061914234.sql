-- Create hotel_bookings table
CREATE TABLE public.hotel_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_reference TEXT NOT NULL,
  hotel_data JSONB NOT NULL,
  guest_last_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create hotel bookings" 
ON public.hotel_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own hotel bookings" 
ON public.hotel_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own hotel bookings" 
ON public.hotel_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all hotel bookings" 
ON public.hotel_bookings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all hotel bookings" 
ON public.hotel_bookings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_bookings;