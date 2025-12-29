-- Drop the overly permissive RLS policies on otp_verifications
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.otp_verifications;
DROP POLICY IF EXISTS "Service role can manage OTP verifications" ON public.otp_verifications;

-- Deny all client access - only service role (Edge Functions) can access this table
CREATE POLICY "Deny all client access" ON public.otp_verifications
FOR ALL USING (false) WITH CHECK (false);