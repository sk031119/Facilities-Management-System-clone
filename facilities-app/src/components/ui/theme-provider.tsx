'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const system = media.matches ? 'dark' : 'light';
    const initial: Theme = stored ?? system;
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');

    const onChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem('theme')) return;
      const nextTheme: Theme = event.matches ? 'dark' : 'light';
      setTheme(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
