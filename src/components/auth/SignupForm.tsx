import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OtpVerification } from './OtpVerification';

interface SignupFormProps {
  onVerificationComplete?: () => void;
}

export function SignupForm({ onVerificationComplete }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{email: string; password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the new server-side signup function that handles everything
      const { data, error } = await supabase.functions.invoke('signup-with-otp', {
        body: {
          email,
          password,
          fullName,
          dateOfBirth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
          phoneNumber: phoneNumber || null,
          countryCode: countryCode || null,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        toast.error(error.message || 'Failed to create account. Please try again.');
        return;
      }

      // Check for application-level errors in the response
      if (data?.error) {
        console.error('Signup error:', data.error);
        toast.error(data.error);
        return;
      }

      // Only show OTP screen if signup was truly successful
      if (data?.success) {
        // Store credentials for auto-login after verification
        setPendingCredentials({ email, password });
        setShowOtpVerification(true);
        toast.success('Verification code sent to your email!');

        // Subscribe to newsletter if opted in (don't block on this)
        if (subscribeNewsletter) {
          supabase.from('newsletter_subscribers').insert({ email }).then(() => {
            // Success - no action needed
          });
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, otp },
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast.error(error.message || 'Verification failed. Please try again.');
        return;
      }

      // Check for application-level errors
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (!data?.success) {
        toast.error('Verification failed. Please try again.');
        return;
      }

      toast.success('Email verified successfully!');

      // Send welcome email (non-blocking)
      supabase.functions.invoke('send-signup-welcome', {
        body: { email, fullName },
      }).catch(() => {
        // Don't fail if welcome email fails
      });

      // Auto-login the user
      if (pendingCredentials) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: pendingCredentials.email,
          password: pendingCredentials.password,
        });

        if (loginError) {
          console.error('Auto-login failed:', loginError);
          toast.info('Account created! Please sign in with your credentials.');
        }
      }

      onVerificationComplete?.();
    } catch (err) {
      console.error('Unexpected verification error:', err);
      toast.error('Failed to verify code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, fullName },
      });

      if (error) {
        console.error('Resend OTP error:', error);
        toast.error(error.message || 'Failed to resend code. Please try again.');
        return;
      }

      // Check for application-level errors
      if (data?.error) {
        // Handle rate limiting specially
        if (data.rateLimited && data.waitSeconds) {
          toast.error(`Please wait ${data.waitSeconds} seconds before requesting a new code.`);
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.success) {
        toast.success('New verification code sent!');
      }
    } catch (err) {
      console.error('Unexpected resend error:', err);
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

      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateOfBirth && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateOfBirth ? format(dateOfBirth, 'PPP') : <span>Select your date of birth</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={dateOfBirth}
              onSelect={setDateOfBirth}
              disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
              captionLayout="dropdown-buttons"
              fromYear={1920}
              toYear={new Date().getFullYear()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Phone Number (Optional)</Label>
        <div className="flex gap-2">
          <CountryCodeSelect
            value={countryCode}
            onValueChange={setCountryCode}
            className="shrink-0"
          />
          <Input
            type="tel"
            placeholder="123 456 7890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
            className="flex-1"
            autoComplete="tel-national"
          />
        </div>
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
