import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { priceSchema, airportCodeSchema, locationNameSchema, validateWithMessage, isValidationError } from '@/lib/validation';

export interface PriceAlert {
  id: string;
  user_id: string;
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  target_price: number;
  current_price: number | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data as PriceAlert[]) || []);
    } catch {
      // Silent fail - user will see empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (
    originCode: string,
    originName: string,
    destinationCode: string,
    destinationName: string,
    targetPrice: number,
    currentPrice?: number,
    userEmail?: string,
    userName?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to set price alerts.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate inputs
    const originCodeVal = validateWithMessage(airportCodeSchema, originCode.toUpperCase());
    if (isValidationError(originCodeVal)) {
      toast({ title: 'Invalid Input', description: 'Invalid origin airport code', variant: 'destructive' });
      return false;
    }

    const destCodeVal = validateWithMessage(airportCodeSchema, destinationCode.toUpperCase());
    if (isValidationError(destCodeVal)) {
      toast({ title: 'Invalid Input', description: 'Invalid destination airport code', variant: 'destructive' });
      return false;
    }

    const originNameVal = validateWithMessage(locationNameSchema, originName);
    if (isValidationError(originNameVal)) {
      toast({ title: 'Invalid Input', description: originNameVal.error, variant: 'destructive' });
      return false;
    }

    const destNameVal = validateWithMessage(locationNameSchema, destinationName);
    if (isValidationError(destNameVal)) {
      toast({ title: 'Invalid Input', description: destNameVal.error, variant: 'destructive' });
      return false;
    }

    const priceVal = validateWithMessage(priceSchema, targetPrice);
    if (isValidationError(priceVal)) {
      toast({ title: 'Invalid Input', description: priceVal.error, variant: 'destructive' });
      return false;
    }

    // Check for existing alert
    const existing = alerts.find(
      a => a.origin_code === originCodeVal.data && 
           a.destination_code === destCodeVal.data && 
           a.is_active
    );

    if (existing) {
      toast({
        title: 'Alert exists',
        description: 'You already have an active alert for this route.',
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .insert([{
          user_id: user.id,
          origin_code: originCodeVal.data,
          origin_name: originNameVal.data,
          destination_code: destCodeVal.data,
          destination_name: destNameVal.data,
          target_price: priceVal.data,
          current_price: currentPrice || null,
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: 'Price Alert Created!',
        description: `We'll notify you at ${userEmail || 'your email'} when ${originCodeVal.data} → ${destCodeVal.data} drops below $${priceVal.data}`,
      });

      await fetchAlerts();
      return true;
    } catch {
      toast({
        title: 'Failed to create alert',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendPriceAlertEmail = async (
    alert: PriceAlert,
    newPrice: number,
    userEmail: string,
    userName?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('send-price-alert-email', {
        body: {
          to: userEmail,
          userName: userName || 'Traveler',
          originName: alert.origin_name,
          originCode: alert.origin_code,
          destinationName: alert.destination_name,
          destinationCode: alert.destination_code,
          targetPrice: alert.target_price,
          currentPrice: newPrice,
          currency: 'USD',
        },
      });

      if (error) throw error;
      console.log('Price alert email sent successfully');
      return true;
    } catch (err) {
      console.error('Failed to send price alert email:', err);
      return false;
    }
  };

  const updateAlert = async (
    alertId: string,
    updates: { target_price?: number; is_active?: boolean }
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Alert Updated',
        description: updates.is_active === false 
          ? 'Price alert has been paused.' 
          : 'Price alert has been updated.',
      });

      await fetchAlerts();
      return true;
    } catch {
      toast({
        title: 'Failed to update alert',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Alert Deleted',
        description: 'Price alert has been removed.',
      });

      await fetchAlerts();
      return true;
    } catch {
      toast({
        title: 'Failed to delete alert',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    alerts,
    loading,
    createAlert,
    updateAlert,
    deleteAlert,
    sendPriceAlertEmail,
    refetch: fetchAlerts,
  };
}
