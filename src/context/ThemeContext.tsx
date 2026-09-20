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
  surface: '#121212',
  card: '#121212',
  cardSecondary: '#1e1e1e',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: '#2c2c2c',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  primary: '#81b64c',
  primaryText: '#ffffff',
  accent: '#38bdf8',
  danger: '#f43f5e',
  boardDark: '#2e3a4e',
  boardLight: '#cbd5e1',
  boardLastMove: 'rgba(56, 189, 248, 0.22)',
  boardSelected: 'rgba(56, 189, 248, 0.38)',
  boardTarget: 'rgba(56, 189, 248, 0.50)',
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
  boardDark: '#779952',
  boardLight: '#edeed1',
  boardLastMove: '#d4e157',
  boardSelected: '#f7f8a1',
  boardTarget: 'rgba(0, 0, 0, 0.22)',
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
