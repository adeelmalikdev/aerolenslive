-- Create missing profiles for any users without profiles
INSERT INTO public.profiles (user_id, full_name)
SELECT 
  au.id as user_id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', NULL) as full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL;

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Enable realtime for price_alerts table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;

-- Enable realtime for saved_searches table
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_searches;