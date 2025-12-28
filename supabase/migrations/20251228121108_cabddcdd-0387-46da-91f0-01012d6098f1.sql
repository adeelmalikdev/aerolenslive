-- Add user_id, attempt_count, and last_sent_at columns to otp_verifications
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON public.otp_verifications (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_otp_verifications_lookup ON public.otp_verifications (email, otp_code, verified);

-- Update RLS policies to allow the service role to manage OTPs
-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.otp_verifications;

-- Create a permissive policy for service role operations (edge functions use service role)
CREATE POLICY "Service role can manage OTPs"
ON public.otp_verifications
FOR ALL
USING (true)
WITH CHECK (true);