import { Link } from 'react-router-dom';
import { Plane, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserDrawer } from './UserDrawer';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50" role="banner">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2" aria-label="AeroLens - Go to homepage">
          <Plane className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold text-foreground">AeroLens</span>
        </Link>

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
