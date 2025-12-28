import { Link, useLocation } from 'react-router-dom';
import { Plane, User, Home, Hotel, BookOpen, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserDrawer } from './UserDrawer';
import { ThemeToggle } from './ThemeToggle';
import { BackButton } from './BackButton';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/hotels', label: 'Hotels', icon: Hotel },
  { to: '/blogs', label: 'Travel Guides', icon: BookOpen },
  { to: '/help', label: 'Help', icon: HelpCircle },
  { to: '/contact', label: 'Contact', icon: Mail },
];

export function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50" role="banner">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main navigation">
        <div className="flex items-center gap-4">
          <BackButton />
          <Link to="/" className="flex items-center gap-2" aria-label="AeroLens - Go to homepage">
            <Plane className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="text-xl font-bold text-foreground">AeroLens</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.to}>
                  <Link to={link.to}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'gap-2',
                        location.pathname === link.to && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!loading && (
            <>
              {user ? (
                <UserDrawer />
              ) : (
                <Button asChild>
                  <Link to="/auth">
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign In
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
