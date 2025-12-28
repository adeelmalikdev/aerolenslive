-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Update the handle_new_user function to extract and save new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  v_full_name TEXT;
  v_date_of_birth DATE;
  v_phone_number TEXT;
  v_country_code TEXT;
BEGIN
  -- Extract and validate full_name
  v_full_name := TRIM(NEW.raw_user_meta_data ->> 'full_name');
  
  -- Apply length constraint
  IF v_full_name IS NOT NULL AND char_length(v_full_name) > 255 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 255);
  END IF;
  
  -- Reject if it contains only whitespace
  IF v_full_name IS NOT NULL AND char_length(TRIM(v_full_name)) = 0 THEN
    v_full_name := NULL;
  END IF;
  
  -- Extract date_of_birth (expecting ISO format YYYY-MM-DD)
  BEGIN
    v_date_of_birth := (NEW.raw_user_meta_data ->> 'date_of_birth')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_date_of_birth := NULL;
  END;
  
  -- Extract and validate phone_number
  v_phone_number := TRIM(NEW.raw_user_meta_data ->> 'phone_number');
  IF v_phone_number IS NOT NULL AND char_length(v_phone_number) > 20 THEN
    v_phone_number := SUBSTRING(v_phone_number, 1, 20);
  END IF;
  
  -- Extract and validate country_code
  v_country_code := TRIM(NEW.raw_user_meta_data ->> 'country_code');
  IF v_country_code IS NOT NULL AND char_length(v_country_code) > 10 THEN
    v_country_code := SUBSTRING(v_country_code, 1, 10);
  END IF;
  
  INSERT INTO public.profiles (user_id, full_name, date_of_birth, phone_number, country_code)
  VALUES (NEW.id, v_full_name, v_date_of_birth, v_phone_number, v_country_code);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    -- Insert with NULL values as fallback
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;