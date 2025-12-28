import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { User, Plane, Trash2, ArrowRight, Save, Bell, Ticket, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useBookings, Booking } from '@/hooks/useBookings';
import { PriceAlertsList } from '@/components/flight/PriceAlerts';
import { cn } from '@/lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { savedSearches, loading: searchesLoading, deleteSearch } = useSavedSearches();
  const { bookings, loading: bookingsLoading } = useBookings();
  
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Profile | AeroLens';
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth ? new Date(profile.date_of_birth) : undefined);
      setCountryCode(profile.country_code || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const cleanedName = fullName.trim();
      await updateProfile({ 
        full_name: cleanedName ? cleanedName : null,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        phone_number: phoneNumber || null,
        country_code: countryCode || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!fullName) return user?.email?.[0]?.toUpperCase() || 'U';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRunSearch = (originCode: string, destinationCode: string) => {
    navigate(`/?origin=${originCode}&destination=${destinationCode}`);
  };

  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{fullName || 'No name set'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={255}
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled aria-describedby="email-hint" />
                <p id="email-hint" className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Date of Birth
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateOfBirth && 'text-muted-foreground'
                      )}
                    >
                      {dateOfBirth ? format(dateOfBirth, 'PPP') : <span>Select your date of birth</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <CalendarComponent
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

              {/* Phone Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Phone Number
                </Label>
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
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving || authLoading}>
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Bookings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" aria-hidden="true" />
              My Bookings
            </CardTitle>
            <CardDescription>Your flight bookings and reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p>No bookings yet</p>
                <p className="text-sm">Search and book a flight to see it here</p>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Your bookings">
                {bookings.map((booking) => (
                  <li key={booking.id}>
                    <BookingCard booking={booking} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Price Alerts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" aria-hidden="true" />
              Price Alerts
            </CardTitle>
            <CardDescription>Get notified when prices drop for your favorite routes</CardDescription>
          </CardHeader>
          <CardContent>
            <PriceAlertsList />
          </CardContent>
        </Card>

        {/* Saved Searches Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" aria-hidden="true" />
              Saved Searches
            </CardTitle>
            <CardDescription>Your saved flight routes for quick access</CardDescription>
          </CardHeader>
          <CardContent>
            {searchesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p>No saved searches yet</p>
                <p className="text-sm">Save a search from the homepage to see it here</p>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Saved searches">
                {savedSearches.map((search) => (
                  <li
                    key={search.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{search.origin_code}</p>
                          <p className="text-xs text-muted-foreground">{search.origin_name}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="font-medium">{search.destination_code}</p>
                          <p className="text-xs text-muted-foreground">{search.destination_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunSearch(search.origin_code, search.destination_code)}
                      >
                        Search
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSearch(search.id)}
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete saved search from ${search.origin_code} to ${search.destination_code}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const flightData = booking.flight_data as {
    airline?: string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    price?: number;
  } | null;

  return (
    <article className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Plane className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{flightData?.origin || 'N/A'}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{flightData?.destination || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{flightData?.airline} {flightData?.flightNumber}</span>
            {flightData?.departureTime && (
              <span>{format(new Date(flightData.departureTime), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-xs px-2 py-1 rounded-full ${
          booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {booking.status.replace('_', ' ').toUpperCase()}
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Ref: <span className="font-mono">{booking.booking_reference}</span>
        </p>
      </div>
    </article>
  );
}
