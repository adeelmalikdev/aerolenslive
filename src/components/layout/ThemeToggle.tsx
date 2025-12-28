import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary"
      >
        <span className="flex items-center justify-center h-full w-full">
          {isDark ? (
            <Moon className="h-3 w-3 text-primary-foreground" />
          ) : (
            <Sun className="h-3 w-3 text-primary-foreground" />
          )}
        </span>
      </Switch>
    </div>
  );
}
