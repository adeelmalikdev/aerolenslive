import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Toggle theme"
    >
      {/* Sun icon on the left */}
      <Sun className="absolute left-1.5 h-4 w-4 text-primary-foreground" />
      
      {/* Moon icon on the right */}
      <Moon className="absolute right-1.5 h-4 w-4 text-primary-foreground" />
      
      {/* Sliding thumb */}
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          isDark ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
