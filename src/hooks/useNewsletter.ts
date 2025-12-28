import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { emailSchema, validateWithMessage, isValidationError } from '@/lib/validation';

export function useNewsletter() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const subscribe = async (email: string): Promise<boolean> => {
    const validation = validateWithMessage(emailSchema, email);
    if (isValidationError(validation)) {
      toast({
        title: 'Invalid Email',
        description: validation.error,
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: validation.data });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Subscribed',
            description: 'This email is already subscribed to our newsletter.',
          });
          return true;
        }
        throw error;
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('send-newsletter-welcome', {
          body: { email: validation.data }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription if email fails
      }

      toast({
        title: 'Successfully Subscribed!',
        description: 'Thank you for subscribing to our newsletter. Check your email for a welcome message!',
      });
      return true;
    } catch {
      toast({
        title: 'Subscription Failed',
        description: 'Unable to subscribe. Please try again later.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading };
}
