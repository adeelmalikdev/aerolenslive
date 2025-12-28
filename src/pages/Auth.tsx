import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

type AuthView = 'auth' | 'forgot' | 'reset';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>('auth');

  useEffect(() => {
    document.title = 'Sign In | AeroLens';
  }, []);

  useEffect(() => {
    // Check if this is a password reset flow
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setView('reset');
    }
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
      if (view === 'reset') return;
      
      if (session) {
        setTimeout(() => {
          checkAdminAndRedirect(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't redirect during password reset
      if (view === 'reset') return;
      
      if (session) {
        checkAdminAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, view]);

  const renderContent = () => {
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
