import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, Loader2 } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { toast } from 'sonner';

type AuthView = 'auth' | 'forgot' | 'reset';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>('auth');
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Use refs to track state for auth listener to avoid stale closures
  const viewRef = useRef(view);
  const isProcessingTokenRef = useRef(isProcessingToken);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    isProcessingTokenRef.current = isProcessingToken;
  }, [isProcessingToken]);

  useEffect(() => {
    document.title = 'Sign In | AeroLens';
  }, []);

  // Handle password reset token from URL hash
  useEffect(() => {
    const handlePasswordResetToken = async () => {
      // Check for hash fragment containing access_token (Lovable Cloud password reset flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');

      // Support token_hash-based recovery links (more resilient than GET /verify links)
      const tokenHash = searchParams.get('token_hash');
      const queryType = searchParams.get('type');

      if ((queryType === 'recovery' || hashType === 'recovery') && tokenHash) {
        // Set both state AND ref immediately before verifyOtp
        // This is critical because onAuthStateChange can fire during auth transitions
        setIsProcessingToken(true);
        isProcessingTokenRef.current = true;
        viewRef.current = 'reset';

        try {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });

          if (error) {
            console.error('Error verifying recovery token hash:', error);
            toast.error('Invalid or expired reset link. Please request a new one.');
            setView('forgot');
            viewRef.current = 'forgot';
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            setView('reset');
            window.history.replaceState(null, '', window.location.pathname + '?mode=reset');
          }
        } catch (err) {
          console.error('Error processing recovery token hash:', err);
          toast.error('Failed to process reset link. Please try again.');
          setView('forgot');
          viewRef.current = 'forgot';
          window.history.replaceState(null, '', window.location.pathname);
        } finally {
          setIsProcessingToken(false);
          isProcessingTokenRef.current = false;
        }
        return;
      }

      // Also check for mode=reset in query params first
      const mode = searchParams.get('mode');
      if (mode === 'reset' && !accessToken) {
        // Already processed, verify session exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setView('reset');
        } else {
          toast.error('Session expired. Please request a new password reset link.');
          setView('forgot');
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      if (hashType === 'recovery' && accessToken && refreshToken) {
        // Set both state AND ref immediately before setSession
        // This is critical because onAuthStateChange fires synchronously
        setIsProcessingToken(true);
        isProcessingTokenRef.current = true;
        viewRef.current = 'reset'; // Pre-set this too
        
        try {
          // Exchange the tokens to establish a session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from recovery token:', error);
            toast.error('Invalid or expired reset link. Please request a new one.');
            setView('forgot');
            viewRef.current = 'forgot';
          } else {
            // Session established, show reset form
            setView('reset');
            // Clear the hash from URL for cleaner look
            window.history.replaceState(null, '', window.location.pathname + '?mode=reset');
          }
        } catch (err) {
          console.error('Error processing recovery token:', err);
          toast.error('Failed to process reset link. Please try again.');
          setView('forgot');
          viewRef.current = 'forgot';
        } finally {
          setIsProcessingToken(false);
          isProcessingTokenRef.current = false;
        }
      }
    };

    handlePasswordResetToken();
  }, [searchParams]);

  useEffect(() => {
    const checkAdminAndRedirect = async (userId: string) => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (data) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't redirect during password reset - use refs for current values
      if (viewRef.current === 'reset' || isProcessingTokenRef.current) return;
      
      // Also check URL for reset mode
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (
        urlParams.get('mode') === 'reset' ||
        urlParams.get('mode') === 'recovery' ||
        !!urlParams.get('token_hash') ||
        hashParams.get('type') === 'recovery'
      )
        return;
      
      if (session) {
        setTimeout(() => {
          // Double-check before redirecting
          if (viewRef.current === 'reset' || isProcessingTokenRef.current) return;
          checkAdminAndRedirect(session.user.id);
        }, 0);
      }
    });

    // Initial session check
    const mode = searchParams.get('mode');
    const hash = window.location.hash;
    const hasRecoveryQuery = mode === 'recovery' || !!searchParams.get('token_hash') || searchParams.get('type') === 'recovery';

    if (mode !== 'reset' && !hasRecoveryQuery && !hash.includes('type=recovery')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && viewRef.current !== 'reset' && !isProcessingTokenRef.current) {
          checkAdminAndRedirect(session.user.id);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const renderContent = () => {
    if (isProcessingToken) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing reset link...</p>
        </div>
      );
    }

    if (view === 'reset') {
      return <ResetPasswordForm />;
    }

    if (view === 'forgot') {
      return <ForgotPasswordForm onBack={() => setView('auth')} />;
    }

    return (
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm onForgotPassword={() => setView('forgot')} />
        </TabsContent>

        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Plane className="h-8 w-8 text-primary" aria-hidden="true" />
            <CardTitle className="text-2xl">AeroLens</CardTitle>
          </div>
          <CardDescription>
            {view === 'reset' 
              ? 'Reset your password' 
              : view === 'forgot' 
                ? 'Recover your account'
                : 'Sign in to save your searches and preferences'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
};

export default Auth;
