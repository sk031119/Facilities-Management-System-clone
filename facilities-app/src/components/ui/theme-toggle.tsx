'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ui/theme-provider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 p-0 rounded-lg text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)] hover:bg-blue-50 dark:hover:bg-white/10 transition-all duration-200"
    >
      <span className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`absolute w-4 h-4 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
            }`}
        />
        <Moon
          className={`absolute w-4 h-4 transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
        />
      </span>
    </Button>
  );
}
