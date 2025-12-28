import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Moon, 
  Sun, 
  Bell, 
  Ticket, 
  Settings, 
  LogOut, 
  ChevronRight,
  Heart,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useHotelBookings } from '@/hooks/useHotelBookings';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useAdmin } from '@/hooks/useAdmin';

export function UserDrawer() {
  const { user, signOut } = useAuth();
  const { bookings } = useBookings();
  const { bookings: hotelBookings } = useHotelBookings();
  const { alerts } = usePriceAlerts();
  const { savedSearches } = useSavedSearches();
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const getInitials = () => {
    if (!user?.user_metadata?.full_name) return 'U';
    return user.user_metadata.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeAlerts = alerts.filter(a => a.is_active);
  // Count all active bookings (not cancelled)
  const activeFlightBookings = bookings.filter(b => b.status !== 'cancelled');
  const activeHotelBookings = hotelBookings.filter(b => b.status !== 'cancelled');
  const totalBookings = activeFlightBookings.length + activeHotelBookings.length;
  const priceDroppedAlerts = alerts.filter(a => a.current_price && a.current_price <= a.target_price);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User menu">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {(activeAlerts.length > 0 || totalBookings > 0) && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {activeAlerts.length + totalBookings}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base truncate">
                {user?.user_metadata?.full_name || 'Welcome'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-400" />
              )}
              <span className="font-medium">Theme</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === 'light' ? 'Light' : 'Dark'}
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Navigation Links */}
          <Link 
            to="/bookings" 
            onClick={() => setOpen(false)}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-primary" />
              <span className="font-medium">My Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              {totalBookings > 0 && (
                <Badge variant="secondary">{totalBookings}</Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link 
            to="/alerts" 
            onClick={() => setOpen(false)}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <span className="font-medium">Price Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              {priceDroppedAlerts.length > 0 && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {priceDroppedAlerts.length} dropped!
                </Badge>
              )}
              {activeAlerts.length > 0 && priceDroppedAlerts.length === 0 && (
                <Badge variant="secondary">{activeAlerts.length}</Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link 
            to="/saved-searches" 
            onClick={() => setOpen(false)}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-medium">Saved Searches</span>
            </div>
            <div className="flex items-center gap-2">
              {savedSearches.length > 0 && (
                <Badge variant="secondary">{savedSearches.length}</Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Separator className="my-4" />

          {isAdmin && (
            <Link 
              to="/admin" 
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Admin Dashboard</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          <Link 
            to="/profile" 
            onClick={() => setOpen(false)}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span>Profile & Settings</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
