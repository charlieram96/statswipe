import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName, themes } from '../constants/themes';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  toggleTheme: () => void;
  setTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@StatSwipe:theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('dark');
  const [theme, setThemeState] = useState<ThemeColors>(themes.dark);

  // Load saved theme on app start
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Update theme state when theme name changes
  useEffect(() => {
    setThemeState(themes[themeName]);
  }, [themeName]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setThemeName(savedTheme as ThemeName);
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
  };

  const saveTheme = async (newThemeName: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeName);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
    saveTheme(newThemeName);
  };

  const toggleTheme = () => {
    const newTheme = themeName === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    themeName,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};