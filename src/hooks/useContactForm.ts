import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email').max(255),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export function useContactForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitContact = async (data: ContactFormData): Promise<boolean> => {
    const validation = contactSchema.safeParse(data);
    
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast({
        title: 'Validation Error',
        description: firstError?.message || 'Please check your input',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: validation.data
      });

      if (error) throw error;

      toast({
        title: 'Message Sent!',
        description: 'Thank you for contacting us. We\'ll get back to you soon!',
      });
      return true;
    } catch (err) {
      console.error('Contact form error:', err);
      toast({
        title: 'Failed to Send',
        description: 'Unable to send your message. Please try again later.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitContact, loading };
}
