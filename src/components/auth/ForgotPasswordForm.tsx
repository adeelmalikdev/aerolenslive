import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use custom Resend email for password reset
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          redirectUrl: `${window.location.origin}/auth?mode=recovery`,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to send reset email');
      } else {
        setSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl mb-4">📧</div>
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="text-muted-foreground text-sm">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-muted-foreground text-sm">
          Click the link in the email to reset your password.
        </p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Forgot your password?</h3>
        <p className="text-muted-foreground text-sm">
          Enter your email and we'll send you a reset link
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Send Reset Link
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to sign in
      </Button>
    </form>
  );
}
