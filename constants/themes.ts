export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Surface colors
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderSecondary: string;
  borderActive: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Team colors
  teamA: string;
  teamB: string;
  
  // Interactive colors
  active: string;
  inactive: string;
  disabled: string;
  
  // Tab bar colors
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const darkTheme: ThemeColors = {
  // Primary colors
  primary: '#FF8032',
  primaryLight: 'rgba(255, 103, 35, 0.2)',
  primaryDark: '#CC521C',
  
  // Background colors
  background: '#131E24',
  backgroundSecondary: '#37464D',
  backgroundTertiary: '#2B373F',
  
  // Surface colors
  surface: '#37464D',
  surfaceSecondary: '#131E24',
  surfaceTertiary: '#2B373F',
  
  // Text colors
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textInverse: '#131E24',
  
  // Border colors
  border: '#2B373F',
  borderSecondary: 'rgba(255, 255, 255, 0.1)',
  borderActive: '#FF8032',
  
  // Status colors
  success: '#4ECDC4',
  warning: '#FFA726',
  error: '#ff3b30',
  info: '#007AFF',
  
  // Team colors
  teamA: '#FF6B6B',
  teamB: '#4ECDC4',
  
  // Interactive colors
  active: '#FF8032',
  inactive: 'rgba(255, 255, 255, 0.6)',
  disabled: 'rgba(255, 103, 35, 0.3)',
  
  // Tab bar colors
  tabBarBackground: '#121E24',
  tabBarBorder: '#2B373F',
  tabBarActive: '#FF8032',
  tabBarInactive: 'rgba(255, 255, 255, 0.6)',
};

export const lightTheme: ThemeColors = {
  // Primary colors
  primary: '#FF8032',
  primaryLight: 'rgba(255, 103, 35, 0.1)',
  primaryDark: '#CC521C',
  
  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundTertiary: '#e9ecef',
  
  // Surface colors
  surface: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  surfaceTertiary: '#e9ecef',
  
  // Text colors
  text: '#000000',
  textSecondary: 'rgba(0, 0, 0, 0.7)',
  textTertiary: 'rgba(0, 0, 0, 0.5)',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#dee2e6',
  borderSecondary: 'rgba(0, 0, 0, 0.1)',
  borderActive: '#FF8032',
  
  // Status colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#007bff',
  
  // Team colors
  teamA: '#FF6B6B',
  teamB: '#4ECDC4',
  
  // Interactive colors
  active: '#FF8032',
  inactive: 'rgba(0, 0, 0, 0.6)',
  disabled: 'rgba(255, 103, 35, 0.3)',
  
  // Tab bar colors
  tabBarBackground: '#ffffff',
  tabBarBorder: '#dee2e6',
  tabBarActive: '#FF8032',
  tabBarInactive: 'rgba(0, 0, 0, 0.6)',
};

export type ThemeName = 'dark' | 'light';

export const themes = {
  dark: darkTheme,
  light: lightTheme,
} as const;