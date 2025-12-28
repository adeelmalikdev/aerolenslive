import { useState, useEffect } from 'react';
import { Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNewsletter } from '@/hooks/useNewsletter';
import { supabase } from '@/integrations/supabase/client';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { subscribe, loading } = useNewsletter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsAuthenticated(true);
      } else {
        setUserEmail(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSubscribe = isAuthenticated ? userEmail : email;
    if (emailToSubscribe) {
      const success = await subscribe(emailToSubscribe);
      if (success && !isAuthenticated) setEmail('');
    }
  };

  return (
    <section className="py-10 sm:py-16 lg:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Subscribe & Receive Our Exclusive Offers
          </h2>
          <p className="text-sm sm:text-base text-primary-foreground/80 mb-6 sm:mb-8">
            Get the best flight deals delivered straight to your inbox
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            {isAuthenticated ? (
              <div className="flex-1 h-11 sm:h-12 bg-primary-foreground text-foreground rounded-md flex items-center px-4 text-left text-sm sm:text-base">
                <Check className="h-4 w-4 text-green-600 mr-2 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
            ) : (
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 sm:h-12 bg-primary-foreground text-foreground placeholder:text-muted-foreground border-0 text-sm sm:text-base"
                required
              />
            )}
            <Button 
              type="submit"
              variant="secondary"
              size="lg"
              className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? 'Subscribing...' : 'Subscribe'} <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
