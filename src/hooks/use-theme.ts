import { create } from 'zustand';

export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  aiLine: string;
  userLine: string;
}

const darkTheme: Theme = {
  primary: '#9EFC62', // Movement Green
  secondary: '#FF00FF', // Movement Magenta
  background: '#000000',
  surface: '#111111',
  foreground: '#FFFFFF',
  muted: '#666666',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  aiLine: '#666666',
  userLine: '#9EFC62',
};

interface ThemeStore {
  theme: Theme;
}

export const useThemeStore = create<ThemeStore>(() => ({
  theme: darkTheme,
}));

export const useTheme = () => useThemeStore((state) => state.theme);
