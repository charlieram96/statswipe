import { StyleSheet } from 'react-native';
import { ThemeColors } from '../constants/themes';

// Utility function to create themed styles
export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  createStyles: (theme: ThemeColors) => T
) => {
  return createStyles;
};

// Common themed style patterns
export const getThemedStyles = (theme: ThemeColors) => ({
  // Container styles
  container: {
    backgroundColor: theme.background,
  },
  containerSecondary: {
    backgroundColor: theme.backgroundSecondary,
  },
  
  // Surface styles
  surface: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  surfaceSecondary: {
    backgroundColor: theme.surfaceSecondary,
    borderColor: theme.borderSecondary,
  },
  
  // Text styles
  text: {
    color: theme.text,
  },
  textSecondary: {
    color: theme.textSecondary,
  },
  textTertiary: {
    color: theme.textTertiary,
  },
  textInverse: {
    color: theme.textInverse,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: theme.primary,
  },
  primaryButtonText: {
    color: theme.textInverse,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.text,
  },
  
  // Input styles
  input: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  },
  
  // Modal styles
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  
  // Selected/Active styles
  selected: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  active: {
    backgroundColor: theme.active,
  },
  disabled: {
    backgroundColor: theme.disabled,
  },
});