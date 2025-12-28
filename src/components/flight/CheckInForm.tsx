import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function CheckInForm() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [checkInResult, setCheckInResult] = useState<'success' | 'error' | 'already' | null>(null);
  const { checkIn, findBooking, loading } = useBookings();
  const { user } = useAuth();

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim() || !lastName.trim()) return;

    const booking = await findBooking(confirmationCode.toUpperCase(), lastName);
    
    if (!booking) {
      setCheckInResult('error');
      return;
    }

    if (booking.status === 'checked_in') {
      setCheckInResult('already');
      return;
    }

    const success = await checkIn(
      booking.id,
      user?.email || undefined,
      user?.user_metadata?.full_name || undefined
    );
    setCheckInResult(success ? 'success' : 'error');
  };

  const resetForm = () => {
    setConfirmationCode('');
    setLastName('');
    setCheckInResult(null);
  };

  if (checkInResult === 'success') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold">Check-In Complete!</h3>
        <p className="text-muted-foreground">
          You're all set for your flight. Check your email for confirmation and boarding details.
        </p>
        <Button variant="outline" onClick={resetForm}>
          Check In Another Passenger
        </Button>
      </div>
    );
  }

  if (checkInResult === 'already') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold">Already Checked In</h3>
        <p className="text-muted-foreground">
          This booking has already been checked in. See you at the gate!
        </p>
        <Button variant="outline" onClick={resetForm}>
          Check In Another Passenger
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Online check-in opens <strong>24 hours</strong> before your scheduled departure time and closes <strong>2 hours</strong> before departure.
        </p>
      </div>

      <form onSubmit={handleCheckIn} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation-code">Confirmation Code</Label>
            <Input
              id="confirmation-code"
              placeholder="e.g., ABC123"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-last-name">Last Name</Label>
            <Input
              id="checkin-last-name"
              placeholder="Enter passenger last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {checkInResult === 'error' && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Booking not found. Please check your details and try again.</span>
          </div>
        )}

        <Button type="submit" disabled={loading || !confirmationCode || !lastName}>
          {loading ? 'Processing...' : 'Check In Now'}
        </Button>
      </form>
    </div>
  );
}
