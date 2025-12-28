-- Create activity_logs table for comprehensive activity tracking
CREATE TABLE public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email text,
    user_name text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    details jsonb DEFAULT '{}',
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow system to insert logs (via service role)
CREATE POLICY "System can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Allow admins to delete old logs
CREATE POLICY "Admins can delete activity logs"
ON public.activity_logs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id uuid,
    p_user_email text,
    p_user_name text,
    p_action text,
    p_entity_type text,
    p_entity_id text DEFAULT NULL,
    p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, user_email, user_name, action, entity_type, entity_id, details)
    VALUES (p_user_id, p_user_email, p_user_name, p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- Trigger to log user signups
CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.log_activity(
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        'signup',
        'user',
        NEW.id::text,
        jsonb_build_object('provider', NEW.raw_app_meta_data ->> 'provider')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_signup_log
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.log_user_signup();

-- Trigger to log newsletter subscriptions
CREATE OR REPLACE FUNCTION public.log_newsletter_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_activity(
            NULL,
            NEW.email,
            NULL,
            'newsletter_subscribe',
            'newsletter',
            NEW.id::text,
            '{}'::jsonb
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
        PERFORM public.log_activity(
            NULL,
            NEW.email,
            NULL,
            'newsletter_unsubscribe',
            'newsletter',
            NEW.id::text,
            '{}'::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_newsletter_change_log
AFTER INSERT OR UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.log_newsletter_subscription();

-- Trigger to log bookings
CREATE OR REPLACE FUNCTION public.log_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_activity(
            NEW.user_id,
            NULL,
            NULL,
            'booking_created',
            'booking',
            NEW.id::text,
            jsonb_build_object('reference', NEW.booking_reference, 'status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.log_activity(
            NEW.user_id,
            NULL,
            NULL,
            'booking_status_changed',
            'booking',
            NEW.id::text,
            jsonb_build_object('reference', NEW.booking_reference, 'old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_change_log
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking();