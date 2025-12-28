import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { OtpVerification } from './OtpVerification';

interface SignupFormProps {
  onVerificationComplete?: () => void;
}

export function SignupForm({ onVerificationComplete }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{email: string; password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, create the user account (but they won't be able to login until verified)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Send OTP email for verification
      const { error: otpError } = await supabase.functions.invoke('send-otp-email', {
        body: { email, fullName },
      });

      if (otpError) {
        console.error('OTP email error:', otpError);
        toast.error('Failed to send verification code. Please try again.');
        return;
      }

      // Store credentials for auto-login after verification
      setPendingCredentials({ email, password });
      setShowOtpVerification(true);
      toast.success('Verification code sent to your email!');

      // Subscribe to newsletter if opted in
      if (subscribeNewsletter) {
        try {
          await supabase.from('newsletter_subscribers').insert({ email });
        } catch {
          // Ignore errors - user is already signed up
        }
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, otp },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid verification code');
        return;
      }

      toast.success('Email verified successfully!');

      // Send welcome email
      try {
        await supabase.functions.invoke('send-signup-welcome', {
          body: { email, fullName },
        });
      } catch {
        // Don't fail if welcome email fails
      }

      // Auto-login the user
      if (pendingCredentials) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: pendingCredentials.email,
          password: pendingCredentials.password,
        });

        if (loginError) {
          toast.info('Please sign in with your credentials.');
        }
      }

      onVerificationComplete?.();
    } catch {
      toast.error('Failed to verify code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, fullName },
      });

      if (error) {
        toast.error('Failed to resend code. Please try again.');
        return;
      }

      toast.success('New verification code sent!');
    } catch {
      toast.error('Failed to resend code. Please try again.');
    }
  };

  const handleBackToSignup = () => {
    setShowOtpVerification(false);
    setPendingCredentials(null);
  };

  if (showOtpVerification) {
    return (
      <OtpVerification
        email={email}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={handleBackToSignup}
        isLoading={loading}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
            required
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-tight cursor-pointer">
            I agree to the{' '}
            <Link to="/terms" className="text-primary underline hover:no-underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary underline hover:no-underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="newsletter"
            checked={subscribeNewsletter}
            onCheckedChange={(checked) => setSubscribeNewsletter(checked === true)}
          />
          <Label htmlFor="newsletter" className="text-sm font-normal leading-tight cursor-pointer">
            I'd like to receive updates, flight deals, and newsletters
          </Label>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading || !agreeToTerms}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : null}
        Create Account
      </Button>
    </form>
  );
}
