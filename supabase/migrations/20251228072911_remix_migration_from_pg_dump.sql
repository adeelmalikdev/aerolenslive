CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_full_name TEXT;
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
  
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, v_full_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    -- Insert with NULL full_name as fallback
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


--
-- Name: unsubscribe_newsletter(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unsubscribe_newsletter(p_email text, p_token uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.newsletter_subscribers
  SET is_active = false
  WHERE email = p_email 
    AND unsubscribe_token = p_token
    AND is_active = true;
  
  RETURN FOUND;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    booking_reference text NOT NULL,
    flight_data jsonb NOT NULL,
    passenger_last_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'confirmed'::text,
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'checked_in'::text])))
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    subscribed_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: price_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    origin_code text NOT NULL,
    origin_name text NOT NULL,
    destination_code text NOT NULL,
    destination_name text NOT NULL,
    target_price numeric(10,2) NOT NULL,
    current_price numeric(10,2),
    is_active boolean DEFAULT true,
    last_checked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT full_name_length_check CHECK ((char_length(full_name) <= 255))
);


--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    origin_code text NOT NULL,
    origin_name text NOT NULL,
    destination_code text NOT NULL,
    destination_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings bookings_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: price_alerts price_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_alerts
    ADD CONSTRAINT price_alerts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: idx_price_alerts_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_alerts_active ON public.price_alerts USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_price_alerts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_alerts_user_id ON public.price_alerts USING btree (user_id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_searches saved_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: newsletter_subscribers Anyone can subscribe to newsletter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


--
-- Name: newsletter_subscribers Deny all SELECT on newsletter_subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deny all SELECT on newsletter_subscribers" ON public.newsletter_subscribers FOR SELECT USING (false);


--
-- Name: bookings Users can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: price_alerts Users can create price alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create price alerts" ON public.price_alerts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users can delete own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own bookings" ON public.bookings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: price_alerts Users can delete own price alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own price alerts" ON public.price_alerts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_searches Users can delete their own saved searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own saved searches" ON public.saved_searches FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_searches Users can insert their own saved searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own saved searches" ON public.saved_searches FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users can update own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: price_alerts Users can update own price alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own price alerts" ON public.price_alerts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: saved_searches Users can update their own saved searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own saved searches" ON public.saved_searches FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users can view own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: price_alerts Users can view own price alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own price alerts" ON public.price_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_searches Users can view their own saved searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own saved searches" ON public.saved_searches FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: price_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_searches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;