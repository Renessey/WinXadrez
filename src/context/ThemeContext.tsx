import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSetting, setSetting } from '../database/db';

export type AppThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: AppThemeMode;
  background: string;
  surface: string;
  card: string;
  cardSecondary: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  danger: string;
  boardDark: string;
  boardLight: string;
  boardLastMove: string;
  boardSelected: string;
  boardTarget: string;
  chipBg: string;
}

const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#000000',
  surface: '#000000',
  card: '#000000',
  cardSecondary: '#0c0c0c',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  primary: '#81b64c',
  primaryText: '#ffffff',
  accent: '#38bdf8',
  danger: '#f43f5e',
  boardDark: '#769656',
  boardLight: '#eeeed2',
  boardLastMove: 'rgba(186, 202, 68, 0.55)',
  boardSelected: 'rgba(247, 247, 105, 0.65)',
  boardTarget: 'rgba(0, 0, 0, 0.25)',
  chipBg: 'rgba(255, 255, 255, 0.08)',
};

const lightColors: ThemeColors = {
  mode: 'light',
  background: '#f2f0eb',
  surface: '#ffffff',
  card: '#ffffff',
  cardSecondary: '#e8e5df',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: '#d8d4cd',
  text: '#171614',
  textSecondary: '#6c6760',
  textMuted: '#9e9992',
  primary: '#769656',
  primaryText: '#ffffff',
  accent: '#c99014',
  danger: '#e04848',
  boardDark: '#769656',
  boardLight: '#eeeed2',
  boardLastMove: 'rgba(186, 202, 68, 0.55)',
  boardSelected: 'rgba(247, 247, 105, 0.65)',
  boardTarget: 'rgba(0, 0, 0, 0.25)',
  chipBg: 'rgba(0, 0, 0, 0.05)',
};

interface ThemeContextType {
  mode: AppThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: AppThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>('dark');

  useEffect(() => {
    const saved = getSetting('theme', 'dark') as AppThemeMode;
    if (saved === 'dark' || saved === 'light') {
      setModeState(saved);
    }
  }, []);

  const setTheme = (nextMode: AppThemeMode) => {
    setModeState(nextMode);
    setSetting('theme', nextMode);
  };

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
