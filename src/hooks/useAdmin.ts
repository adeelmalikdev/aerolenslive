import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, isLoading };
}

export function useAdminData() {
  const [users, setUsers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profilesRes, subscribersRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (subscribersRes.error) throw subscribersRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      setUsers(profilesRes.data || []);
      setSubscribers(subscribersRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubscriber = async (id: string) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setSubscribers(prev => prev.filter(s => s.id !== id));
  };

  const toggleSubscriberStatus = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) throw error;
    setSubscribers(prev => prev.map(s => 
      s.id === id ? { ...s, is_active: !isActive } : s
    ));
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status } : b
    ));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    users,
    subscribers,
    bookings,
    isLoading,
    error,
    refetch: fetchAllData,
    deleteSubscriber,
    toggleSubscriberStatus,
    updateBookingStatus,
  };
}
