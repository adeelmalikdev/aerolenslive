import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SavedSearch {
  id: string;
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  created_at: string;
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavedSearches = useCallback(async () => {
    if (!user) {
      setSavedSearches([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  // Realtime subscription for saved searches
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('saved-searches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_searches',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Saved search change received:', payload);
          fetchSavedSearches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSavedSearches]);

  const saveSearch = async (
    originCode: string,
    originName: string,
    destinationCode: string,
    destinationName: string
  ) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save searches.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Check for duplicate
      const existing = savedSearches.find(
        (s) => s.origin_code === originCode && s.destination_code === destinationCode
      );

      if (existing) {
        toast({
          title: 'Already saved',
          description: 'This route is already in your saved searches.',
        });
        return false;
      }

      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        origin_code: originCode,
        origin_name: originName,
        destination_code: destinationCode,
        destination_name: destinationName,
      });

      if (error) throw error;

      toast({
        title: 'Search saved',
        description: `${originCode} → ${destinationCode} added to your saved searches.`,
      });

      await fetchSavedSearches();
      return true;
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: 'Error',
        description: 'Failed to save search. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSearch = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_searches').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Search removed',
        description: 'The saved search has been removed.',
      });

      await fetchSavedSearches();
      return true;
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove search. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    savedSearches,
    loading,
    saveSearch,
    deleteSearch,
    refetch: fetchSavedSearches,
  };
}
