import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../stores/gameStore';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS } from '../constants/fonts';

const modes = [
  { value: 1, label: '1v1' },
  { value: 2, label: '2v2' },
  { value: 3, label: '3v3' },
  { value: 4, label: '4v4' },
  { value: 5, label: '5v5' },
] as const;

export const ModeSelectScreen: React.FC = () => {
  const navigation = useNavigation();
  const setMode = useGameStore((state) => state.setMode);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleModeSelect = (mode: 1 | 2 | 3 | 4 | 5) => {
    setMode(mode);
    navigation.navigate('RosterSelect' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Select Game Mode</Text>
        <Text style={styles.subtitle}>Select the number of players per team</Text>
        
        <View style={styles.modesContainer}>
          {modes.map((mode) => (
            <Pressable
              key={mode.value}
              style={({ pressed }) => [
                styles.modeButton,
                pressed && styles.modeButtonPressed
              ]}
              onPress={() => handleModeSelect(mode.value)}
            >
              <Text style={styles.modeLabel}>{mode.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    textAlign: 'center',
    marginBottom: 8,
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.regular,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  modeButton: {
    width: 100,
    height: 50,
    backgroundColor: '#FF6723',
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 5px 0px 0px rgb(204, 82, 28)',
  },
  modeButtonPressed: {
    transform: [{ translateY: 5 }],
    boxShadow: 'none',
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    letterSpacing: 2,
  },
});