import { useState, useEffect } from 'react';
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

  useEffect(() => {
    document.title = 'Sign In | AeroLens';
  }, []);

  // Handle password reset token from URL hash
  useEffect(() => {
    const handlePasswordResetToken = async () => {
      // Check for hash fragment containing access_token (Supabase password reset flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken && refreshToken) {
        setIsProcessingToken(true);
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
        } finally {
          setIsProcessingToken(false);
        }
      } else {
        // Check for mode=reset in query params (after token processed)
        const mode = searchParams.get('mode');
        if (mode === 'reset') {
          // Verify there's actually a session for password reset
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setView('reset');
            } else {
              toast.error('Session expired. Please request a new password reset link.');
              setView('forgot');
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
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
      // Don't redirect during password reset
      if (view === 'reset' || isProcessingToken) return;
      
      if (session) {
        setTimeout(() => {
          checkAdminAndRedirect(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't redirect during password reset
      if (view === 'reset' || isProcessingToken) return;
      
      if (session) {
        checkAdminAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, view, isProcessingToken]);

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
